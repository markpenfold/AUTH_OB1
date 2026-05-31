import { createClient } from '@/lib/supabase/server'
import { LoginForm } from '@/components/LoginForm'
import styles from '@/app/styles/styles.module.css'
import Link from 'next/link'
import { redirect } from 'next/navigation'

type LoginProps = {
  searchParams: Promise<{ message?: string }>
}

export default async function LoginPage({ searchParams }: LoginProps) {
  // 1. Check authentication entirely on the server via cookies
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If already logged in, bounce them immediately before sending HTML
  if (user) {
    redirect('/')
  }

  const { message } = await searchParams

  return (
    <div className={styles.formHolder}>
      {message && (
        <div style={{ color: '#38bdf8', padding: '10px', backgroundColor: 'rgba(2, 132, 199, 0.1)', marginBottom: '15px', borderRadius: '6px' }}>
          {message}
        </div>
      )}
      <div className={styles.p4}>
        <h1>Log in</h1>
        {/* The form itself remains a client component to handle typing and submission */}
        <LoginForm />
        <div>
          <Link className={styles.lnk} href='/forgotten-password'>Forgot your password?</Link>
        </div>
      </div>
    </div>
  )
}