'use client'

import { useActionState, useState } from 'react'
import { signup, ActionState } from '@/actions/auth'
import { signUpSchema } from '@/lib/validations/primitives'
import styles from "@/app/styles/styles.module.css" // Assuming your style path

interface SignupFormProps {
  selectedPlan: string
}

export function SignupForm({selectedPlan}: SignupFormProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(signup, null);
  const [clientError, setClientError] = useState<string | null>(null)

  // Track the password input live
  const [password, setPassword] = useState('')
  // Real-time validation checks
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  const planChoice = selectedPlan;

  async function handleSubmit(formData: FormData) {
    setClientError(null)
    
    // 1. Convert FormData to an object
    const rawData = Object.fromEntries(formData)
    
    // 2. Validate with Zod
    const result = signUpSchema.safeParse(rawData)

    if (!result.success) {
      // Show the very first error message Zod finds
      setClientError(result.error.issues[0].message)
      return 
    }

    // 3. If valid, send to the Server Action
    formAction(formData);
  }

  return (
    <>
  <div className={styles.fbox}>
    <form action={handleSubmit} className={styles.authForm}>
      <h2>Create a new {planChoice} account</h2>

      {/* Unified Error Display */}
      {(clientError || state?.error) && (
        <p className={styles.error}>{clientError || state?.error}</p>
      )}
      {/* Example: A hidden input to pass the plan to your server action */}
      <input type="hidden" name="plan_choice" value={selectedPlan} />

      {/* Row 1 */}
      <label htmlFor="full_name">Full Name</label>
      <input id="full_name" name="full_name" type="text" placeholder="John Doe" />

      {/* Row 2 */}
      <label htmlFor="username">Username</label>
      <input id="username" name="username" type="text" placeholder="johndoe123" />

      {/* Row 2.5 */}
      <label htmlFor="account_name">Account Name</label>
      <input id="account_name" name="account_name" type="text" placeholder="Work" />

      {/* Row 3 */}
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" placeholder="you@example.com" />

      {/* Row 4 */}
      <label htmlFor="password">Password</label>
      <input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />   

      {/* Real-time Checklist UI Component */}
        {password.length > 0 && (
          <div className={styles.checklist}>
            <div className={hasMinLength ? styles.valid : styles.invalid}>
              {hasMinLength ? '●' : '○'} At least 8 characters
            </div>
            <div className={hasUppercase ? styles.valid : styles.invalid}>
              {hasUppercase ? '●' : '○'} One uppercase letter
            </div>
            <div className={hasNumber ? styles.valid : styles.invalid}>
              {hasNumber ? '●' : '○'} One number
            </div>
          </div>
        )}

      {/* Row 5 */}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating Account...' : 'Sign up'}
      </button>
    </form>
        
  </div>

</>
)
}