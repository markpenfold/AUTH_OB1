// components/SiteNav.tsx

import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import classes from '@/app/styles/styles.module.css';
import { logout } from "@/actions/auth";
import OmenAvatar from './OmenAvatar';
import {Profile} from "@/lib/types"
import { getAvatarUrl } from '@/lib/constants';


export function SiteNav({ user, profile }: { user: User | null, profile: Profile | null }) {
  // 1. GUEST VIEW: If no user, show simple nav and exit early
  console.log("profile in SiteNav is:", profile)
  if (!user) {
    return (
      <nav>
        <div className={classes.lnk_holder}>
          <Link className={classes.lnk} href="/">Home</Link>
          <Link className={classes.lnk} href="/blog">Blog</Link>
          <div className={classes.right}>
            <Link className={classes.lnk} href="/login">Log in</Link>
            <Link className={classes.lnk} href="/signup">Sign up</Link>
          </div>
        </div>
      </nav>
    )
  }

  // 2. AUTHENTICATED LOGIC: If we reach here, 'user' is guaranteed to exist.
  const displayName = profile?.full_name || user.email || 'User';
  const avatarSrc = getAvatarUrl(user.id, profile?.has_avatar ?? false, displayName);

  if(profile){
  console.log("avatar?", profile.has_avatar, 'for: ', profile.full_name);
  } 
  if(!profile){
    console.log("no cunting profile in sitenav")
  }
  
  
  return (
    <nav>
      {/* Always visible */}
      <div className={classes.lnk_holder}>
        <Link className={classes.lnk} href="/">Home</Link>
        <Link className={classes.lnk}  href="/blog">Blog</Link>
        <Link className={classes.lnk}  href="/forum">Forum</Link>
        <Link className={classes.lnk}  href="/charts">Charts</Link>
      </div>

      <div className={classes.lnk_holder}  >
        <Link className={classes.lnk}  href="/dashboard">Dashboard</Link>
        <Link className={classes.lnk}  href="/omenland">OB1</Link>
        <Link className={classes.lnk}  href="/dashboard/settings">Settings</Link>
      </div>
            
      <div className={classes.right}>
        <span className={classes.user_name}>{profile?.full_name ?? user.email}</span>
        
        <span> {profile?.full_name ?? 'fuk'}</span>
        <OmenAvatar src={avatarSrc} name={displayName} size="md" />
        <button className={[classes.ml4,classes.bgRed ].join(" ")} type="submit" onClick={logout}>Logout</button>
      </div>
          
    </nav>
  )
}