import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardAccountUI } from '@/components/DashboardAccountUI'
import { DashboardUI } from '@/components/DashboardUI'
import type { Account } from '@/lib/types'

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = await params;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <DashboardAccountUI accountId={accountId} />;
}