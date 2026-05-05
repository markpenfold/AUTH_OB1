// components/UpdatePasswordForm.tsx
'use client'

import { useActionState } from 'react' // New in Next.js 15/16
import styles from "@/app/styles/page.module.css"
import { updatePassword } from '@/actions/auth'

export type ActionState = {
  error?: string;
  success?: boolean;
} | null;


export function UpdatePasswordForm() {
  // state is the return value of your server action
  // action is what you pass to the form's 'action' prop
  // isPending tells you if the server is still thinking
  const [state, action, isPending] = useActionState<ActionState, FormData>(updatePassword, null)

  return (
    <form action={action} className={styles.formContainer}>
      <h2>Set New Password</h2>
      
      {/* Show errors from the Server Action directly */}
      {state?.error && <p className={styles.errorText}>{state.error}</p>}

      <div className={styles.gap}>
        <label htmlFor="password">New Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Min 6 characters"
        />
      </div>

      <div className={styles.gap}>
        <label htmlFor="confirmPassword">Confirm New Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
        />
      </div>

      <div className={styles.gap2}>
        <button type="submit" disabled={isPending}>
          {isPending ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </form>
  )
}