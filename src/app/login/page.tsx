import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from '@/components/LoginForm'
import styles from '@/app/styles/styles.module.css';
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser()

  if (user){
    //redirect('/')
  }

  // 2. Await the searchParams to get the "Password updated" message
  const { message } = await searchParams;


  return (
    <div className={styles.formHolder}>
      {message && (
        <div>
          {message}
        </div>
      )}
          <div className={styles.p4}>
            <h1>Log in</h1>
            <LoginForm />
            <div>
              <Link className={styles.lnk} href='/forgotten-password'>Forgot your password?</Link></div>
            </div>
    </div>
);
}