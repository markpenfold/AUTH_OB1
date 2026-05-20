import { createClient } from '@/lib/supabase/server'
import classes from '@/app/styles/styles.module.css'
import Link from 'next/link' //
import { CheckoutButton } from '@/components/CheckoutButton'

// Simple helper to check active subscription tier state
function get_plan(id: string) {
  // Replace this placeholder with a database fetch down the line
  return 'free' 
}

export default async function PricingPage({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser()
  const resolvedParams = await searchParams;
  const error = resolvedParams?.error;
  
  let current_plan = 'none'
  if (user) {
    current_plan = get_plan(user.id)
  }

  // Helper array to keep the HTML rendering neat, organized, and DRY
  const tiers = [
    { name: 'Free', id: 'free', price: '£0', type: 'signup' },
    { name: 'Standard', id: 'standard', price: '£10/Mo', type: 'premium' },
    { name: 'Pro', id: 'pro', price: '£25/Mo', type: 'premium' },
    { name: 'Team', id: 'team', price: '£8/Mo Per member', type: 'premium' },
    { name: 'Founder', id: 'founder', price: '£120/Year For ever', type: 'premium' },
  ]
  return (
    <div className={classes.pageContainer}>
      {error === 'session_expired' && (
        <div style={{ color: 'red', padding: '10px', border: '1px solid red' }}>
         Your signup session expired or was invalid. Please try selecting your plan again.
        </div>
      )}
      <div className={classes.pageHeader}>
        <h1>Choose your plan</h1>
      </div>
      
      <div className={classes.priceContainer}>
        {tiers.map((tier) => {
          const isCurrentPlan = current_plan === tier.id

          return (
            <div key={tier.id} className={classes.priceBox}>
              <h3>{tier.name}</h3>
              <div>{tier.price}</div>

              {/* DYNAMIC ACTION BUTTON GENERATOR */}
              {isCurrentPlan ? (
                // Scenario A: User is looking at their current subscription
                <button disabled className={classes.buttonClass} style={{ opacity: 0.5 }}>
                  Current Plan
                </button>
              ) : !user ? (
                // Scenario B: Anonymous visitor. Send them to registration.
                <Link href={`/signup?plan=${tier.id}`} className={classes.buttonClass}>
                  Sign up
                </Link>
              ) : tier.id === 'free' ? (
                // Scenario C: Logged in, wanting to downgrade to free (Handle via account panel normally)
                <Link href="/dashboard" className={classes.buttonClass}>
                  Go to Dashboard
                </Link>
              ) : (
                // Scenario D: Logged in, purchasing a premium tier. Fires secure POST directly to Stripe.
                <CheckoutButton plan={tier.id} className={classes.buttonClass}>
                  Upgrade
                </CheckoutButton>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}