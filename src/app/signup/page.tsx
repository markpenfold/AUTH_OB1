
import { createClient } from '@/lib/supabase/server'
import { SignupForm } from '@/components/SignupForm'
import { redirect } from 'next/navigation'

export default async function SignupPage() {
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

return (
    <div>
        <p>hi</p>
        <div>
      <h1>Sign up</h1>
      <SignupForm />
    </div>

    </div>
);
}