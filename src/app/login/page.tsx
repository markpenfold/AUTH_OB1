import { createClient } from '@/lib/supabase/server'
import { LoginForm } from '@/components/LoginForm'
import styles from '@/app/styles/styles.module.css'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

type LoginProps = {
  searchParams: Promise<{ message?: string }>
}

export default async function LoginPage({ searchParams }: LoginProps) {
  // 1. Check authentication entirely on the server via cookies
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  
  // If already logged in, route them intelligently instead of dumping them on the homepage
  if (user) {
    const cookieStore = await cookies()
    const workspaceContext = cookieStore.get('user_workspace_context')
    
    let destination = '/dashboard'
    
    if (workspaceContext?.value) {
      try {
        const context = JSON.parse(workspaceContext.value)
        // If they only have one workspace, match your Server Action logic
        if (context.count === 1 && context.defaultId) {
          destination = `/dashboard/${context.defaultId}`
        }
      } catch (e) {
        // Fallback safely to standard dashboard if JSON parsing fails
        destination = '/dashboard'
      }
    }

    console.log(`User already logged in. Redirecting straight to: ${destination}`)
    redirect(destination)
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