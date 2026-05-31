'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/auth/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import classes from '@/app/styles/sitenav.module.css'

interface SiteNavProps {
  initialUser: any | null
  initialProfile: any | null
}

export function SiteNav({ initialUser, initialProfile }: SiteNavProps) {
  const router = useRouter()
  const supabase = createClient()
  
  // 1. Extract exactly what your context returns
  const { user: offlineUser, isOnline, isAuthorized: offlineAuth } = useAuth()

  // 2. Resolve authentication status
  // Authenticated if the server layout found a cookie, OR if the offline context says true
  const activeUser = initialUser || offlineUser
  const isAuthorized = !!initialUser || offlineAuth

  // 3. 🧠 Smart Field Extraction (Server snake_case vs Client camelCase)
  // We use lookarounds to bypass empty strings '' or nulls gracefully
  const rawName = initialProfile?.full_name || offlineUser?.fullName || activeUser?.email || 'User'
  const username = initialProfile?.username || offlineUser?.username || activeUser?.email?.split('@')[0] || 'user'
  const hasAvatar = initialProfile?.has_avatar || offlineUser?.hasAvatar

  // If the fullName field is just their email, we clean up the presentation name
  const displayName = rawName.includes('@') ? rawName.split('@')[0] : rawName

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    await supabase.auth.signOut()
    localStorage.removeItem('app_auth_snapshot')
    window.location.href = '/login'
  }

  // Safe initials parser that handles names, usernames, or email prefixes cleanly
  const getInitials = (name: string) => {
    const cleanName = name.replace(/[._+]/g, ' ') // turn mark_penfold into mark penfold
    return cleanName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const avatarUrl = hasAvatar 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${activeUser?.id}.png`
    : null

  return (
    <nav className={classes.container}>
      <div className={classes.linksGroup}>
        <Link href="/" className={classes.brandLink}>⚡ MainApp</Link>
        {isAuthorized && (
          <Link href="/dashboard" className={classes.link}>Dashboard</Link>
        )}
      </div>

      <div>
        {isAuthorized && activeUser ? (
          <div className={classes.userSection}>
            {!isOnline && <span className={classes.offlineBadge}>Offline Mode</span>}
            
            <div className={classes.profileMeta}>
              <span className={classes.userName}>{displayName}</span>
              <span className={classes.usernameSub}>@{username}</span>
            </div>

            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={`${displayName}'s avatar`} 
                className={classes.avatar}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <div className={classes.avatarFallback}>
                {getInitials(displayName)}
              </div>
            )}

            <button onClick={handleLogout} className={classes.logoutBtn}>
              Logout
            </button>
          </div>
        ) : (
          <Link href="/login" className={classes.loginBtn}>Login</Link>
        )}
      </div>
    </nav>
  )
}