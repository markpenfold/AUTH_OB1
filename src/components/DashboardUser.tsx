import { cookies } from 'next/headers'
import { DataAccessPanel } from '@/components/dashboard/data/DataAccessPanel'
import Link from 'next/link'
import classes from '@/app/styles/styles.module.css'
import  AvatarUpload  from '@/components/AvatarUpload'
import type { User} from '@supabase/supabase-js'
import type {Account, DashboardUserProps} from '@/lib/types'


export async function DashboardUser({ user, message }:DashboardUserProps) {

    
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

      {message && (
        <div style={{ color: 'green', padding: '10px', border: '1px solid green' }}>
          {message}
        </div>
      )}
      {/* Always visible */}
      <div className={classes.dashBox}>
        <h3>Upload an avatar</h3>
        <AvatarUpload userId={user.id}/>
      </div>

      <div className={classes.dashBox}>
        <h3> Reset your password: <Link className={classes.lnk}  href="/update-password">
        <button>RESET</button></Link>
        </h3>
      </div>

      </div> 
  )
}