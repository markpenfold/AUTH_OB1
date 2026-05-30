// components/SiteNav.tsx

import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import classes from '@/app/styles/styles.module.css';
import { logout } from "@/actions/auth";
import OmenAvatar from './OmenAvatar';
import {Profile} from "@/lib/types"
import { getAvatarUrl } from '@/lib/constants';
import { useAuth } from '@/app/auth/context/AuthContext';


export function SiteNav() {

  // 1. Grab everything directly from the client state engine
  const { user, isLoading, isOnline, tier } = useAuth()

  // LOADING SKELETON: Prevents the navigation from flashing layout changes during boots
  if (isLoading) {
    return (
      <nav className={classes.lnk_holder}>
        <div className={classes.leftLinks}>
          <span className="text-slate-500 text-xs animate-pulse">Synchronizing session...</span>
        </div>
      </nav>
    )
  }


  // 2. GUEST VIEW: If no user is authenticated, 
  // exit early with the landing links
  if (!user) {
    return (
      <nav>
        <div className={classes.lnk_holder}>
          <Link className={classes.lnk} href="/">Home</Link>
          <Link className={classes.lnk} href="/blog">Blog</Link>
          <div className={classes.right}>
            <Link className={classes.lnk} href="/login">Log in</Link>
            <Link className={classes.lnk} href="/pricing">Pricing</Link>
            <Link className={classes.lnk} href="/pricing">Sign up</Link>
          </div>
        </div>
      </nav>
    )
  }


  // 3. AUTHENTICATED VIEW: Evaluated safely because 'user' is guaranteed to exist.
  // We use the camelCased properties pre-assembled by our AuthContext resolution loop.
  const displayName = user.fullName || user.email || 'User'
  const avatarSrc = getAvatarUrl(user.id, user.hasAvatar, displayName)

  return (
    <nav className={classes.lnk_holder}>
      {/* Navigation Links (Left Side) */}
      <div className={classes.leftLinks}>
        <Link className={classes.lnk} href="/">Home</Link>
        <Link className={classes.lnk} href="/blog">Blog</Link>
        <Link className={classes.lnk} href="/forum">Forum</Link>
        <Link className={classes.lnk} href="/omenland">Omenland</Link>
        
        {/* Optional: Visual proof of subscription level and connectivity status */}
        <span className="text-[10px] ml-2 px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400 font-mono capitalize">
          {tier} {isOnline ? '🟢' : '✈️'}
        </span>
      </div>

      {/* User Actions & Profile Elements (Right Side) */}
      <div className={classes.right}>
        <div className={classes.navBarID}>
          <span className={classes.user_name}>{user.fullName}</span>
          
          <OmenAvatar src={avatarSrc} name={displayName} size="md" />
          
          <button 
            className={[classes.ml4, classes.bgRed].join(" ")} 
            type="submit" 
            onClick={logout}
          >
            Logout
          </button>
          
          <Link className={classes.lnk} href="/pricing">Pricing</Link>
          <Link className={classes.lnk} href="/dashboard">Dashboard</Link>
        </div>
      </div>
    </nav>
  )


}// ends