// src/actions/auth.ts
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {ActionState} from '@/components/UpdatePasswordForm'
import { headers } from 'next/headers'

export async function requestPasswordReset(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createClient()
  
  // Get the site URL dynamically so it works in localhost and production
  const origin = (await headers()).get('origin')

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // This tells Supabase where to send the user after they click the email link
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: "Check your email for the reset link!" }
}





export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/update-password`,
  })

  if (error) return { error: error.message }
  return { success: "Check your email for the reset link!" }
}


export async function updatePassword(prevState: ActionState, formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const supabase = await createClient()

  if (password !== confirmPassword) {
    // 2. Return an object that matches the 'initialState' shape (null or { error: string })
    return { error: "Passwords do not match." }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return { error: error.message }
  }

  // Password updated! Send them to the dashboard.
  redirect('/dashboard?message=Password updated successfully')
}



export async function login(formData: FormData) {
    const cookieStore = await cookies()
    const supabase = await createClient()
  
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })
  
    if (error) {
      redirect('/login?error=Invalid credentials')
    }
  
    redirect('/dashboard')
  }

export async function logout() {
  const cookieStore = await cookies()
  const supabase = await createClient()

  await supabase.auth.signOut()
  redirect('/')
}



export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  const cookieStore = await cookies()
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      // Everything inside 'data' goes into raw_user_meta_data
      data: {
        full_name: name,
        // you could add more here, like 'registration_source: "web"'
      }
    }
  
  })

  if (error) {
    redirect(`/signuperror=${encodeURIComponent(error.message)}`)
  }

  // Set the "One-Time Pass" cookie.
  // We make it 'httpOnly' so JavaScript can't touch it (security!)
  // We set 'maxAge' to 600 seconds (10 minutes) so it expires quickly.
  cookieStore.set('allow_confirm', 'true', {
    maxAge: 600, 
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  })

  redirect('/confirm');
}