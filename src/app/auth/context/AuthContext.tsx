'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isReallyOnline } from '@/lib/utils/checkOnline'

type AuthTier = 'free' | 'pro' | 'team' | 'founder' | null

type AuthUser = {
  id: string
  email: string
  fullName: string
  username: string
  hasAvatar: boolean
  updatedAt: string
}

type AuthAccount = {
  id: string
  role: 'owner' | 'member' | 'admin'
}

type WorkspaceItem = {
  accountId: string
  role: 'owner' | 'member' | 'admin'
  tier: AuthTier
}

type AuthState = {
  isLoading: boolean
  isAuthorized: boolean
  isOnline: boolean
  tier: AuthTier
  user: AuthUser | null
  account: AuthAccount | null
  roster: WorkspaceItem[]
  workloads: any[]
}

interface AuthProviderProps {
  children: React.ReactNode
  serverUser: any | null
  serverProfile: any | null
}


const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children, serverUser, serverProfile }: AuthProviderProps) {
  
  // 🌟 Bootstrap the state instantly using server data if it exists!
  const [state, setState] = useState<AuthState>({
    isLoading: !serverUser, // If server found a user, we aren't loading from scratch!
    isAuthorized: !!serverUser,
    isOnline: true,
    tier: null, // Roster mapping will fill this in right after mount
    user: serverUser ? {
      id: serverUser.id,
      email: serverUser.email || '',
      fullName: serverProfile?.full_name || serverUser.email || 'User',
      username: serverProfile?.username || '',
      hasAvatar: serverProfile?.has_avatar ?? false,
      updatedAt: serverProfile?.updated_at || '',
    } : null,
    account: null,
    roster: [],
    workloads: [],
  })

  // Use a ref to keep track of the current request sequence to prevent race conditions
  const requestCount = useRef(0)

  useEffect(() => {
    const supabase = createClient()
    let isMounted = true

    const triggerRecheck = () => {
      resolveAuthentication()
    }

    // 📡 Network status listeners
    window.addEventListener('online', triggerRecheck)
    window.addEventListener('offline', triggerRecheck)

    async function resolveAuthentication() {
      const currentRequestInstance = ++requestCount.current
      const verifiedOnline = await isReallyOnline()

      // Prevent processing if the component unmounted during the ping check
      if (!isMounted) return

      // ==========================================
      // 🚀 TIER 1: ONLINE RESOLUTION
      // ==========================================
      if (verifiedOnline) {
        try {
          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

          if (!isMounted || currentRequestInstance !== requestCount.current) return

          if (!authUser || authError) {
            localStorage.removeItem('app_auth_snapshot')
            setState({
              isLoading: false,
              isAuthorized: false,
              isOnline: true,
              tier: null,
              user: null,
              account: null,
              roster: [],
              workloads: []
            })
            return
          }

          const profilePromise = supabase
            .from('profiles')
            .select('full_name, username, has_avatar, updated_at')
            .eq('id', authUser.id)
            .single()

          const membershipsPromise = supabase
            .from('memberships')
            .select(`
              account_id,
              role,
              accounts ( plan_name )
            `)
            .eq('user_id', authUser.id)

          const [profileResponse, membershipsResponse] = await Promise.all([
            profilePromise,
            membershipsPromise
          ])

          // Double check component status after heavy database calls
          if (!isMounted || currentRequestInstance !== requestCount.current) return

          const { data: profile, error: profileError } = profileResponse
          const { data: memberships, error: dbError } = membershipsResponse

          if (profileError) console.error('❌ Profile sub-query failed:', profileError.message)
          if (dbError) console.error('❌ Memberships sub-query failed:', dbError.message)

          // 1. Safe sort logic
          const sortedMemberships = (memberships || []).sort((a, b) => {
            const roleA = a?.role || 'member'
            const roleB = b?.role || 'member'
            if (roleA === 'owner' && roleB !== 'owner') return -1
            if (roleA !== 'owner' && roleB === 'owner') return 1
            return 0
          })

          const liveUser: AuthUser = {
            id: authUser.id,
            email: authUser.email || '',
            fullName: profile?.full_name || authUser.email || 'User',
            username: profile?.username || '',
            hasAvatar: profile?.has_avatar ?? false,
            updatedAt: profile?.updated_at || '',
          }

          const workspaceRoster: WorkspaceItem[] = sortedMemberships.map((m: any) => ({
            accountId: m.account_id,
            role: m.role,
            tier: m.accounts?.plan_name || 'free'
          }))

          const activeWorkspace = workspaceRoster[0] || null
          const liveAccount: AuthAccount | null = activeWorkspace ? { id: activeWorkspace.accountId, role: activeWorkspace.role } : null
          const liveTier: AuthTier = activeWorkspace ? (activeWorkspace.tier as AuthTier) : 'free'

          const onlineState: AuthState = {
            isLoading: false,
            isAuthorized: true,
            isOnline: true,
            tier: liveTier,
            user: liveUser,
            account: liveAccount,
            roster: workspaceRoster,
            workloads: []
          }

          localStorage.setItem('app_auth_snapshot', JSON.stringify({
            user: liveUser,
            roster: workspaceRoster,
            account: liveAccount,
            tier: liveTier,
            workloads: [],
            timestamp: Date.now(),
          }))

          setState(onlineState)
          return

        } catch (err) {
          console.warn('[Auth] Network request crashed. Forcing local fallback evaluation.', err)
        }
      }

      // ==========================================
      // ✈️ TIER 2: OFFLINE FALLBACK RESOLUTION
      // ==========================================
      const localSnapshotRaw = localStorage.getItem('app_auth_snapshot')
      
      if (localSnapshotRaw && isMounted && currentRequestInstance === requestCount.current) {
        try {
          const snapshot = JSON.parse(localSnapshotRaw)
          const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
          const isExpired = Date.now() - snapshot.timestamp > THIRTY_DAYS

          if (!isExpired) {
            if (snapshot.tier === 'free') {
              setState({
                isLoading: false,
                isAuthorized: false,
                isOnline: false,
                tier: 'free',
                user: null,
                account: null,
                roster: [],
                workloads: []
              })
              return
            }

            setState({
              isLoading: false,
              isAuthorized: true,
              isOnline: false,
              tier: snapshot.tier,
              user: snapshot.user,
              account: snapshot.account,
              roster: snapshot.roster,
              workloads: []
            })
            return
          }
        } catch (parseError) {
          console.error('❌ Failed parsing local storage snapshot corrupt text:', parseError)
          localStorage.removeItem('app_auth_snapshot') // Clear bad data automatically
        }
      }

      // ==========================================
      // ❌ TIER 3: DENIED
      // ==========================================
      if (isMounted && currentRequestInstance === requestCount.current) {
        setState({
          isLoading: false,
          isAuthorized: false,
          isOnline: verifiedOnline,
          tier: null,
          user: null,
          account: null,
          roster: [],
          workloads: []
        })
      }
    }

    // ⚡ INITIAL RUN
    resolveAuthentication()

    // 🔄 REALTIME AUTH STATE LISTENER (Keeps context synchronized on sign-in/sign-out actions)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        resolveAuthentication()
      }
    })

    return () => {
      isMounted = false
      window.removeEventListener('online', triggerRecheck)
      window.removeEventListener('offline', triggerRecheck)
      subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be consumed strictly within an AuthProvider configuration wrapper.')
  }
  console.log("sending auth context:", context)
  return context
}