// components/LoginForm.tsx  (Client Component)
'use client'

import { useSearchParams } from 'next/navigation'
import { login, ActionState } from '@/actions/auth'
import styles from '@/app/styles/styles.module.css';

export function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <form action={login}>
      {error && <p>{error}</p>}

      <div className={styles.p4}>
        <label className={styles.p4} htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </div>

      <div className={styles.p4}>
        <label className={styles.p4} htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />

        
      </div>
      <div className={styles.p4}>
        <button type="submit">Log in</button>
      </div>
      
    </form>
  )
}