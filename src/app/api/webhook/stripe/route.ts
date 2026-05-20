import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAccountByStripeId } from '@/lib/supabase/queries'
import {createAdminClient} from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

const supabaseAdmin = await createAdminClient();

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      // 1. Sync Catalog Artifacts
      case 'product.created':
      case 'product.updated':
        await handleProductSync(event.data.object as Stripe.Product);
        break;

      case 'price.created':
      case 'price.updated':
        await handlePriceSync(event.data.object as Stripe.Price);
        break;

      // 2. Provision / Upgrade Core Subscriptions
      case 'checkout.session.completed':
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const response = await handleSubscriptionProvisioning(event);
        if (response) return response; // Respects early returns from the internal shield
        break;

      // 3. De-provisioning / Teardown
      case 'customer.subscription.deleted':
        await handleSubscriptionDeletion(event.data.object as Stripe.Subscription);
        break;
    }
  } catch (handlerError: any) {
    console.error(`Webhook execution failed internally for ${event.type}:`, handlerError.message);
    // Return a 500 status code so Stripe knows to safely retry transmitting the payload later
    return new NextResponse(`Internal Handler Error`, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/******************************************************
 * Syncs Stripe Products with Supabase Catalog Tables
 ********************************************************/
async function handleProductSync(product: Stripe.Product) {
  await supabaseAdmin.from('products').upsert({
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description,
    image: product.images?.[0],
    metadata: product.metadata,
  }, { onConflict: 'id' });
}

/******************************************************
 * Syncs Stripe Prices with Supabase Catalog Tables
 *****************************************************/
async function handlePriceSync(price: Stripe.Price) {
  await supabaseAdmin.from('prices').upsert({
    id: price.id,
    product_id: price.product as string,
    active: price.active,
    currency: price.currency,
    type: price.type,
    unit_amount: price.unit_amount,
    interval: price.recurring?.interval,
    interval_count: price.recurring?.interval_count,
  }, { onConflict: 'id' });
}

/******************************************************
 * Handles Complex Provisioning, Idempotency Safeguards, and Rollback Routing
 *****************************************************/
async function handleSubscriptionProvisioning(event: Stripe.Event) {
  let customerId: string;
  let subscriptionId: string;
  let planChoice: string | undefined;
  let sessionMetadata: Stripe.Metadata | undefined;

  console.log(`[Webhook Event Received] Type: ${event.type}`);

  // 1. Extract structural data based on the event type
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    customerId = session.customer as string;
    subscriptionId = session.subscription as string;
    planChoice = session.metadata?.planChoice || session.metadata?.plan; // Support both naming variants
    sessionMetadata = session.metadata || undefined;
  } else {
    const subscription = event.data.object as Stripe.Subscription;
    customerId = subscription.customer as string;
    subscriptionId = subscription.id;
    planChoice = subscription.metadata?.planChoice || subscription.metadata?.plan;
    sessionMetadata = subscription.metadata || undefined; 
  }

  // 2. Fetch full operational data from Stripe
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const subscriptionItem = sub.items.data[0];
  const customerObj = await stripe.customers.retrieve(customerId);
  
  if (customerObj.deleted) {
    console.warn(`[Webhook Warning] Intercepted operational events for an already deleted Stripe customer: ${customerId}`);
    return;
  }

  // =========================================================
  // IDENTITY RESOLUTION PIPELINE
  // =========================================================
  let userId: string | null = null;
  let accountId: string | null = null;

  // PATH A: The Primary Gold Standard Lookup (Query by Stripe Customer ID)
  console.log(`[Webhook] Attempting account lookup via Stripe Customer ID: ${customerId}`);
  const matchedAccount = await getAccountByStripeId(customerId);
  
  // IT WORKED. WE HAVE ACCOUNT AND SUB //////////////////
  if (matchedAccount) {
    userId = matchedAccount.user_id;
    accountId = matchedAccount.id;
    console.log(`[Webhook] Identity found via DB mapping. Account: ${accountId}, User: ${userId}`);
  }

  // PATH B: First Fallback (Extract from Stripe Object Metadata maps)
  if (!userId) {
    userId = customerObj.metadata?.userId || sessionMetadata?.userId || null;
    if (userId) console.log(`[Webhook Recovery] Identity extracted from Stripe object metadata: ${userId}`);
  }

  // PATH C: Second Fallback (Ultimate backup lookup by Customer Email)
  if (!userId && customerObj.email) {
    console.log(`[Webhook Warning] Metadata missing. Attempting email lookup for: ${customerObj.email}`);
    
    const { data: userLookup } = await supabaseAdmin
      .from('users') 
      .select('id')
      .eq('email', customerObj.email)
      .single();

    if (userLookup) {
      userId = userLookup.id;
      console.log(`[Webhook Recovery] Successfully recovered userId (${userId}) via email fallback.`);
    }
  }

  // KILL PATH: Containment Mechanism if all mapping vectors failed
  if (!userId) {
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('id', subscriptionId)
      .single();

    if (existingSub) {
      console.log(`[Idempotency Shield] Safely ignored missing userId for already processed subscription: ${subscriptionId}`);
      return NextResponse.json({ received: true });
    }

    console.error(`FATAL BILLING ERROR: Unidentifiable transaction context! Customer ID: ${customerId}, Sub ID: ${subscriptionId}`);
    
    // Execute defensive rollback loops
    await executeAutoRecoveryRollback(sub, customerId, subscriptionId);
    await sendEmergencyAdminAlert({
      customerId,
      subscriptionId,
      error: "Payment finalized, but internal database userId was lost or unresolvable across both session and customer data wrappers."
    });
    return;
  }

  // =========================================================
  // DATABASE PROVISIONING SEQUENCING
  // =========================================================

  // Resolve the accountId via membership table ONLY if Path A missed it
  if (!accountId) {
    console.log(`[Webhook Debug] Checking membership role for Workspace context...`);
    const { data: membership, error: memberError } = await supabaseAdmin
      .from('memberships')
      .select('account_id')
      .eq('user_id', userId)
      .eq('role', 'owner')
      .single();

    if (memberError) console.error("[Webhook Debug] Membership lookup error:", memberError);
    accountId = membership?.account_id || null;
  }

  // Execute workspace package upgrade changes
  if (accountId) {
    console.log(`[Webhook Debug] Found target account ${accountId}. Provisioning package update...`);
    const { error: accountError } = await supabaseAdmin
      .from('accounts')
      .update({ 
        plan_name: planChoice || 'free', 
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      })
      .eq('id', accountId);
    
    if (accountError) {
      console.error("[Webhook Debug] Account tier change failure:", accountError);
    } else {
      console.log(`[Webhook Success] Upgraded account ${accountId} to tier: ${planChoice || 'free'}`);
    }
  } else {
    console.error(`CRITICAL: System could not locate an owned account record associated with user ID: ${userId}`);
  }

  return NextResponse.json({ received: true });
}




/**
 * Clears database permissions if a subscription is deleted/terminated upstream
 */
async function handleSubscriptionDeletion(subscription: Stripe.Subscription) {
  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'canceled', ended_at: new Date().toISOString() })
    .eq('id', subscription.id);
  
  console.log(`Successfully updated subscription status to canceled for: ${subscription.id}`);
}

/**
 * Isolated logic layer for managing refunds and cancellations
 */
async function executeAutoRecoveryRollback(sub: Stripe.Subscription, customerId: string, subscriptionId: string) {
  try {
    if (sub.latest_invoice) {
      const invoice = await stripe.invoices.retrieve(sub.latest_invoice as string);
      const paymentIntentId = (invoice as any)['payment_intent'] as string | undefined;
      
      if (paymentIntentId) {
        const refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          reason: 'requested_by_customer', 
          metadata: {
            reason: 'Automated SaaS rollback: Missing internal userId mapping correlation during fulfillment.',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId
          }
        });
        console.warn(`[Auto-Recovery] Successfully issued immediate refund (${refund.id})`);
      } else {
        console.error(`[Auto-Recovery Warning] Could not extract payment_intent from invoice ${invoice.id}.`);
      }
    }
    
    await stripe.subscriptions.cancel(subscriptionId);
    console.warn(`[Auto-Recovery] Canceled rogue subscription ${subscriptionId}`);
  } catch (recoveryError: any) {
    console.error("CRITICAL: Automated rollback refund/cancellation sequence failed!", recoveryError.message);
  }
}

interface AlertPayload {
  customerId: string;
  subscriptionId: string;
  error: string;
}

async function sendEmergencyAdminAlert({ customerId, subscriptionId, error }: AlertPayload) {
  const timestamp = new Date().toISOString();
  const alertMessage = `
    EMERGENCY SAAS BILLING ALERT
    Timestamp: ${timestamp}
    Issue: ${error}
    Stripe Customer ID: ${customerId}
    Stripe Subscription ID: ${subscriptionId}
  `;
  console.error(alertMessage);
}



