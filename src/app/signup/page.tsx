
import { createClient } from '@/lib/supabase/server'
import { SignupForm } from '@/components/SignupForm'
import { redirect } from 'next/navigation'
import classes from '@/app/styles/styles.module.css'

interface SignupPageProps {
  searchParams: Promise<{ plan?: string }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const resolvedParams = await searchParams
  const selectedPlan = resolvedParams.plan || 'free' // Fallback to free if empty

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  

return (
    <div className={classes.p4}>
      
        <SignupForm selectedPlan={selectedPlan}/>
    </div>
);
}