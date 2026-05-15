import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

  // Verify the user actually belongs to THIS specific account
  const { data: membership } = await supabase
    .from('memberships')
    .select(`accounts(*)`)
    .eq('user_id', user.id)
    .eq('account_id', accountId)
    .single();

  if (!membership) {
    // User is trying to access an account they don't own
    redirect('/dashboard');
  }

  const activeAccount = membership.accounts as unknown as Account;

  // 3. THE CRITICAL SAFETY GUARD
  // If the join failed (activeAccount is null), don't let it reach the status check
  if (!activeAccount) {
    console.error("Account data missing for membership:", accountId, activeAccount);
    // Optional: Redirect to a 'contact support' or back to picker
    redirect('/login?error=MEMBERSHIT')
  }


  // Subscription Gate
  if (activeAccount.subscription_status === 'inactive') {
    redirect('/billing/reactivate');
  }

  return <DashboardUI user={user} account={activeAccount} />;
}