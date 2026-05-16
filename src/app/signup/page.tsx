
import { createClient } from '@/lib/supabase/server'
import { SignupForm } from '@/components/SignupForm'
import { redirect } from 'next/navigation'
import classes from '@/app/styles/styles.module.css'

export default async function SignupPage() {
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

return (
    <div className={classes.p4}>
        <SignupForm />
    </div>
);
}