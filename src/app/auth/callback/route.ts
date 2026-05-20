import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  // SECURITY Strictly sanitize the redirect path to prevent open redirects
  let next = searchParams.get('next') || '/dashboard'
  if (!next.startsWith('/') || next.startsWith('//')) {
    console.log("OH DO FUCK OFF")
    next = '/dashboard'
  }
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // No code present? Get out early.
  if (!code) {
    return NextResponse.redirect(new URL('/auth/auth-code-error', siteUrl).toString())
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    // Got an error or missing user? Get out early.
    if (error || !data?.user) {
      return NextResponse.redirect(new URL('/auth/auth-code-error', siteUrl).toString())
    }
    
    // SUCCESS PATH
  const user = data.user
  const supabaseAdmin = await createAdminClient()
  
  try {
    const { data: membership } = await supabaseAdmin
      .from('memberships')
      .select('account_id, accounts(stripe_customer_id)')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .single()

    const currentAccountId = membership?.account_id
    // @ts-ignore
    const existingStripeId = membership?.accounts?.stripe_customer_id
    
    if (currentAccountId && !existingStripeId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      })

      await supabaseAdmin
        .from('accounts')
        .update({ stripe_customer_id: customer.id })
        .eq('id', currentAccountId)
    }
  } catch (stripeErr) {
    console.error('Non-blocking provisioning warning:', stripeErr)
  }

  // Final happy-path redirect
  console.log("HAPPY NOW?", user?.user_metadata?.pending_plan)
  
    const pendingPlan = user?.user_metadata?.pending_plan

    // 🚀 IF THEY CHOSE A PAID PLAN, SEND THEM TO STRIPE CHECKOUT INSTEAD OF THE DASHBOARD
    if (pendingPlan && pendingPlan !== 'free') {
      const checkoutUrl = new URL('/api/checkout/stripe', siteUrl)
      checkoutUrl.searchParams.set('plan', pendingPlan)
      checkoutUrl.searchParams.set('userId', user.id)
      if (user.email) checkoutUrl.searchParams.set('email', user.email)
      
      return NextResponse.redirect(checkoutUrl.toString())
    }
  return NextResponse.redirect(new URL(next, siteUrl).toString())
  }
}