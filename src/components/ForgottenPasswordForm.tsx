// components/ForgotPasswordForm.tsx
'use client'

import { useActionState } from 'react'
import { requestPasswordReset } from '@/actions/auth'
import styles from "@/app/styles/page.module.css"
import Link from 'next/link'

export function ForgottenPasswordForm() {
  const [state, action, isPending] = useActionState(requestPasswordReset, null)

  if (state?.success) {
    return (
      <div className={styles.successCard}>
        <h1>Check your inbox</h1>
        <p>{state.success}</p>
        <div className={styles.gap2}>
          <Link href="/login" className={styles.backButton}>
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form action={action} className={styles.form}>
      <p>Enter your email and we'll send you a link to get back into your account.</p>

      {state?.error && <p className={styles.error}>{state.error}</p>}

      <div className={styles.gap}>
        <label htmlFor="email">Email Address</label>
        <input id="email" name="email" type="email" required placeholder="you@example.com" />
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? 'Sending...' : 'Send Reset Link'}
      </button>
    </form>
  )
}