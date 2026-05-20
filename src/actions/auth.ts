// src/actions/auth.ts
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updatePasswordSchema } from "@/lib/validations/primitives";
import { headers } from 'next/headers'
import { forgotPasswordSchema } from "@/lib/validations/primitives";

export type ActionState = {
  error?: string;
  success?: boolean;
} | null;



export async function requestPasswordReset(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createClient()
  // Get the site URL dynamically so it works in localhost and production
  const origin = (await headers()).get('origin')

  const validated = forgotPasswordSchema.safeParse({ email: email });

  //local zod test for input failed so...
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  // now send to supabase, and await return value
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // This tells Supabase where to send the user after they click the email link
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: "Check your email for the reset link!" }
}


export async function resetPassword(prevState: ActionState, formData: FormData) {

  const supabase = await createClient()

  // 1. Convert all form fields to an object for Zod
  const rawData = Object.fromEntries(formData)
  // 2. Validate against the schema (this checks password + confirmation match)
  const validated = updatePasswordSchema.safeParse(rawData)

  if (!validated.success) {
    // Return Zod issue if validation fails
    return { error: validated.error.issues[0].message };
  }


  // 3. Supabase only needs the validated password
  const { error } = await supabase.auth.updateUser({
    password: validated.data.password
  })

  if (error) return { error: error.message }
  
  // Redirect to login or profile after success
  redirect('/login?message=Password updated successfully')
}


export async function login(formData: FormData) {
    const cookieStore = await cookies()
    const supabase = await createClient()
  
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })
  
    if (error) {
      redirect('/login?error=Invalid credentials')
    }

    // 2. Get the user's memberships immediately after successful auth
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return redirect('/login?error=auth-failed')
    }
  
    //this just happens once at login
    const { data: memberships = []} = await supabase
    .from('memberships')
    .select('account_id')
    .eq('user_id', user.id)

    
    // 1. Comprehensive Guard Clause (Safe from crashing)
    // If it's null or empty, handle it and exit.
    if (!memberships || memberships.length === 0 || memberships[0]?.account_id === null) {
      redirect('/onboarding/setup-account')
    }

    // SMART ROUTING WITH MEM COUNT
    const mem_count = memberships.length || 0
    const isSingleAccount = mem_count === 1
    const firstAccountId = memberships[0].account_id

    // 2. Bake the Cookie
    cookieStore.set('user_workspace_context', JSON.stringify({
      count: mem_count,
      defaultId: isSingleAccount ? firstAccountId : null 
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    })

    // 3. Routing
    if (isSingleAccount) {
      redirect(`/dashboard/${firstAccountId}`)
    }

    redirect('/dashboard')



  }



export async function logout() {
  const cookieStore = await cookies()
  const supabase = await createClient()

  await supabase.auth.signOut()
  redirect('/')
}



export async function signup(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = formData.get('full_name') as string
  const username = formData.get('username') as string
  const account_name = formData.get('account_name') as string
  const planChoice = formData.get('plan_choice') as string // 'pro', 'team', etc.

  const cookieStore = await cookies()
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      // This forces Supabase to route the email click directly to your file!
      emailRedirectTo: `${siteUrl}/auth/callback?plan=${planChoice}`,
      // Everything inside 'data' goes into raw_user_meta_data
      data: {
        full_name: full_name,
        username: username,
        account_name:account_name,
        pending_plan: planChoice,
        // you could add more here, like 'registration_source: "web"'
      }
    }
  
  })

  if (error) {
    return { error: error.message };
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
  //https://nxomemwpdnljmenxwdvr.supabase.co/auth/v1/verify?token=pkce_71711d2c1d9ac75f1675e8ff0c9f8bb11fcb892a0563a81607281e63&type=signup&redirect_to=http://localhost:3000
}