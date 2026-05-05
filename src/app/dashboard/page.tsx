import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
//import { UpgradePrompt } from '@/components/dashboard/UpgradePrompt'
//import { RecentActivity } from '@/components/dashboard/RecentActivity'
//import { UsageStats } from '@/components/dashboard/UsageStats'
import { DataAccessPanel } from '@/components/dashboard/data/DataAccessPanel'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import classes from '@/app/styles/styles.module.css'
import  AvatarUpload  from '@/components/AvatarUpload'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  
  
  const cookieStore = await cookies();
  const supabase = await createClient();
  const { message } = await searchParams;

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status')
    .eq('id', user.id)
    .single()

  const tier = profile?.subscription_tier ?? 'free'
  const isActive = profile?.subscription_status === 'active'

  const getUserInitials = () => {
    const name = user?.user_metadata?.full_name || user?.email || 'U'
      return name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

  // Fetch dashboard data — RLS ensures user only gets their own rows
  const { data: recentActivity } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div>
      <h1>Dashboard for {getUserInitials()}</h1>
      {message && (
        <div style={{ color: 'green', padding: '10px', border: '1px solid green' }}>
          {message}
        </div>
      )}
      {/* Always visible */}
      <div>
        <h3>Upload an avatar</h3>
        <AvatarUpload userId={user.id}/>
      </div>
      <div><h3> Reset your password: <Link className={classes.lnk}  href="/update-password"><button>RESET</button></Link></h3></div>
      {/* Free users see usage limits */}
     
    <div className={classes.lnk_holder}>
      <div>YOUR TIER IS {tier} </div>

      {/* Only paid subscribers see this panel */}
      {tier !== 'free' && isActive ? (
        <DataAccessPanel userId={user.id} tier={tier} />
      ) : (
        <div>UPGRADE TO PRO, MOFO</div>
      )}
      </div> 
    </div>
  )
}