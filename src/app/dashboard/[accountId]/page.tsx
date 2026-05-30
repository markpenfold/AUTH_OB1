import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardAccountUI } from '@/components/DashboardAccountUI'
import { DashboardUI } from '@/components/DashboardUI'
import type { Account } from '@/lib/types'

type DashboardProps = {
  searchParams: Promise<{ session_id?: string, accountId: string }>
}


export default async function WorkspacePage({ searchParams }: DashboardProps) {
  const params = await searchParams
  const  accountId  = params.accountId;
  const stripeSessionId = params.session_id;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <DashboardAccountUI accountId={accountId} />;
}