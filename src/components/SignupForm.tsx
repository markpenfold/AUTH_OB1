'use client'

import { useActionState, useState } from 'react'
import { signup, ActionState } from '@/actions/auth'
import { signUpSchema } from '@/lib/validations/primitives'
import styles from "@/app/styles/page.module.css" // Assuming your style path



export function SignupForm() {
  const [state, action, isPending] = useActionState<ActionState, FormData>(signup, null);
  const [clientError, setClientError] = useState<string | null>(null)

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
    action(formData);
  }

  return (
    <form action={handleSubmit} className={styles.form}>
      <h2>Create a new account</h2>

      {/* Unified Error Display */}
      {(clientError || state?.error) && (
        <p className={styles.error}>{clientError || state?.error}</p>
      )}

      <div>
        <label htmlFor="full_name">Full Name</label>
        <input id="full_name" name="full_name" type="text" placeholder="John Doe" />
      </div>

      <div>
        <label htmlFor="username">Username</label>
        <input id="username" name="username" type="text" placeholder="johndoe123" />
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" placeholder="you@example.com" />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" placeholder="••••••••" />
      </div>

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating Account...' : 'Sign up'}
      </button>
    </form>
  )
}