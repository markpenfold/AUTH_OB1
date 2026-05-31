import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import classes from '@/app/styles/styles.module.css'
import type { Account } from '@/lib/types'

export default async function DashboardRootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user){
    console.log("redirect from within main dashboard page")
     redirect('/login')
    };

  const { data: memberships } = await supabase
    .from('memberships')
    .select(`account_id, accounts(*)`)
    .eq('user_id', user.id);

  if (!memberships || memberships.length === 0) {
    redirect('/pricing');
  }

  // If only one account, skip the picker and go straight to the workspace URL
  if (memberships.length === 1) {
    redirect(`/dashboard/${memberships[0].account_id}`);
  }

  return (
    <div className={classes.pickerContainer}>
      <h2>Choose your workspace</h2>
      <div className={classes.accountGrid}>
        {memberships.map((m) => {
          const acc = m.accounts as unknown as Account;
          return (
            <Link key={m.account_id} href={`/dashboard/${m.account_id}`}>
              <div className={classes.accountCard}>
                <h3>{acc.name || 'Personal'}</h3>
                <span>{acc.plan_name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}