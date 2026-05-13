import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia", // Use the latest stable version
});

// Use the Service Role Key to bypass RLS for administrative updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text(); // Must be text for signature verification
  const signature = (await headers()).get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as any;

  switch (event.type) {
    // 1. Sync Products & Prices (When you edit them in Stripe Dashboard)
    case 'product.created':
    case 'product.updated':
      await supabaseAdmin.from('products').upsert({
        id: session.id,
        active: session.active,
        name: session.name,
        description: session.description,
        image: session.images?.[0],
        metadata: session.metadata,
      });
      break;

    case 'price.created':
    case 'price.updated':
      await supabaseAdmin.from('prices').upsert({
        id: session.id,
        product_id: session.product,
        active: session.active,
        currency: session.currency,
        type: session.type,
        unit_amount: session.unit_amount,
        interval: session.recurring?.interval,
        interval_count: session.recurring?.interval_count,
      });
      break;

    // 2. Handle Subscriptions
    case 'checkout.session.completed':
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const sub = subscription as Stripe.Subscription;
        // Accessing the nested properties based on your JSON sample
        const subscriptionItem = sub.items.data[0];

        await supabaseAdmin.from('subscriptions').upsert({
        id: sub.id,
        user_id: session.metadata?.userId,
        status: sub.status,
        price_id: subscriptionItem.price.id,
        // Using the nested current_period_end from your JSON
        current_period_end: new Date(subscriptionItem.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
        });
      break;

    case 'customer.subscription.deleted':
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'canceled', ended_at: new Date().toISOString() })
        .eq('id', session.id);
      break;
  }

  return NextResponse.json({ received: true });
}