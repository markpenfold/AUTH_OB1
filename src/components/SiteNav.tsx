// components/SiteNav.tsx

import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import classes from '@/app/styles/styles.module.css';
import { logout } from "@/actions/auth";
import OmenAvatar from './OmenAvatar';

type Profile = {
  full_name: string | null
  subscription_tier: string | null
  avatar_url: string | null
}

export function SiteNav({ user, profile }: { user: User | null, profile: Profile | null }) {
  return (
    <nav>
      {/* Always visible */}
      <div className={classes.lnk_holder}>
        <Link className={classes.lnk} href="/">Home</Link>
        <Link className={classes.lnk}  href="/blog">Blog</Link>
        <Link className={classes.lnk}  href="/forum">Forum</Link>
        <Link className={classes.lnk}  href="/charts">Charts</Link>
        {profile ? (
          <div className={classes.right}>
            <div className={classes.p4}><OmenAvatar 
            src={profile.avatar_url} 
            name={profile.full_name || 'Anonymous'} 
            size="md" 
          />
          </div>
          </div>
          ):(<div>OM</div>)}
      </div>

      {/* Auth-dependent */}
      <div>
        {user ? (
          <>
          <div className={classes.lnk_holder}  >
            <Link className={classes.lnk}  href="/dashboard">Dashboard</Link>
            <Link className={classes.lnk}  href="/omenland">OB1</Link>
            <Link className={classes.lnk}  href="/dashboard/settings">Settings</Link>
            
          <div className={classes.right}>
            <span className={classes.user_name}>{profile?.full_name ?? user.email}</span>
            <span> {profile?.subscription_tier ?? 'free'} tier</span>
            <button className={[classes.ml4,classes.bgRed ].join(" ")} type="submit" onClick={logout}>Logout</button>
            
          
          </div>
          
      </div>
          </>
        ) : (
          <>
          <div className={classes.lnk_holder}  >
            <Link className={classes.lnk}  href="/login">Log in</Link>
            <Link className={classes.lnk}  href="/signup">Sign up</Link>
            </div>
          </>
        )}
      </div>
    </nav>
  )
}