import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from '@/components/LoginForm'
import styles from '@/app/styles/styles.module.css';
import Link from 'next/link'

export default async function LoginPage() {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser()


  return (
    <div className={styles.formHolder}>
          <div className={styles.p4}>
            <h1>Log in</h1>
            <LoginForm />
            <div>
              <Link className={styles.lnk} href='/forgotten-password'>Forgot your password?</Link></div>
            </div>
    </div>
);
}