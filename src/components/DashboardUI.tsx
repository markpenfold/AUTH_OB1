import { cookies } from 'next/headers'
import { DataAccessPanel } from '@/components/dashboard/data/DataAccessPanel'
import Link from 'next/link'
import classes from '@/app/styles/styles.module.css'
import  AvatarUpload  from '@/components/AvatarUpload'
import type { User} from '@supabase/supabase-js'
import type {Account, DashboardUIProps} from '@/lib/types'


export async function DashboardUI({ user, account, message }:DashboardUIProps) {

    const tier = account.plan_name ?? 'free'
    const isActive = account.subscription_status === 'active'

    const getUserInitials = () => {
        const name = user?.user_metadata?.full_name || user?.email || 'U'
        return name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        }


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