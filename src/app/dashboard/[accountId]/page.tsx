import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardAccountUI } from '@/components/DashboardAccountUI'

type DashboardProps = {
  params: Promise<{ accountId: string }>
  searchParams: Promise<{ session_id?: string; message?: string }>
}

export default async function WorkspacePage({ params, searchParams }: DashboardProps) {
  // 1. Resolve your asynchronous Next.js layout parameters
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  
  const accountId = resolvedParams.accountId
  const stripeSessionId = resolvedSearchParams.session_id
  const message = resolvedSearchParams.message

  // 2. Authenticate the user securely on the backend
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 🛡️ Guard: If no cookie session exists, reject them right here
  if (!user) {
    console.log("user NOT FOUND in accountId dashboard")
    redirect('/login')
  }

  // 🚀 Pass verified server data straight down into the UI template
  return (
    <DashboardAccountUI 
      accountId={accountId} 
      session_id={stripeSessionId} 
      message={message} 
    />
  )
}