// src/context/AuthContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isReallyOnline } from '@/lib/utils/checkOnline'

type AuthTier = 'free' | 'pro' | 'team' | 'founder' | null

type AuthUser = {
  id: string
  email: string
  fullName: string
  username: string
  hasAvatar: boolean
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
}

const AuthContext = createContext<AuthState | undefined>(undefined)

// executes on refresh 
export function AuthProvider({ children }: { children: React.ReactNode }) {

  // Set up state for our auth object
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthorized: false,
    isOnline: true, // ping will confirm or deny
    tier: null,
    user: null,
    account: null,
    roster: [],
  })

  // runs on component render client side only
  useEffect(() => {
    const supabase = createClient()


    const triggerRecheck = function() {
      return resolveAuthentication();
    }

    // 📡 Network status listeners
    // When network status changes, run triggerRecheck
    window.addEventListener('online', triggerRecheck)
    window.addEventListener('offline', triggerRecheck)

    ////////////////////////////////////////////////////////////////////////
    // evaluates conditions linearly ///////////////////////////////////////
    // acts as security gatekeeper   ///////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////
    async function resolveAuthentication() {
      // 🕵️‍♂️ Step 1: Run your custom ping check
      const verifiedOnline = await isReallyOnline()

      // ==========================================
      // 🚀 TIER 1: ONLINE RESOLUTION
      // ==========================================
      if (verifiedOnline) {
        try {
          ////////////////////////////////////////////////////////////////////////////////////
          // We are online so get user auth from supabase -> put it in authUser  /////////////
          ////////////////////////////////////////////////////////////////////////////////////
          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

          // The golden path /////////////////////////////////////////////////////////////////
          if (authUser && !authError) {
          // ONE QUERY: Pulls their profile and ALL their workspaces at once
          const { data: memberships, error: dbError } = await supabase
            .from('memberships')
            .select(`
              account_id,
              role,
              accounts ( plan_name ),
              profiles ( full_name, username, has_avatar )
            `)
            .eq('user_id', authUser.id)

            if (dbError || !memberships || memberships.length === 0) throw new Error("No workspaces found")

            // 1. Extract global profile details from the first workspace entry
            const sampleProfile = memberships[0].profiles as any
            const liveUser: AuthUser = {
              id: authUser.id,
              email: authUser.email || '',
              fullName: sampleProfile?.full_name || authUser.email || 'User',
              username: sampleProfile?.username || '',
              hasAvatar: sampleProfile?.has_avatar ?? false,
            }

            // 2. Map their entire hot-swappable workspace roster
            const workspaceRoster = memberships.map((m: any) => ({
              accountId: m.account_id,
              role: m.role,
              tier: m.accounts?.plan_name || 'free'
            }))

            // 3. Determine their ACTIVE workspace (default to the first one, or read from a URL/Cookie)
            const activeWorkspace = workspaceRoster[0]

            // Create a cohesive onlineState object
            const onlineState: AuthState = {
              isLoading: false,
              isAuthorized: true,
              isOnline: true,
              tier: activeWorkspace.tier, // Dynamic tier based on active space
              user: liveUser,
              account: { id: activeWorkspace.accountId, role: activeWorkspace.role },
              roster: workspaceRoster // The whole list is kept in memory for instant switching!
            }

            // THE MIRROR: Save detailed snapshot mapping structures to local memory
            localStorage.setItem('app_auth_snapshot', JSON.stringify({
            user: liveUser,
            roster: workspaceRoster,
            activeAccountId: activeWorkspace.accountId,
            timestamp: Date.now(),
          }))

          //The runtime updates dispatcher hook, setting everything in motion
          setState(onlineState)
          return
          }
        } catch (err) {
          console.warn('[Auth] Network issues. Moving to local fallback.')
        }
      }

      // ==========================================
      // ✈️ TIER 2: OFFLINE FALLBACK RESOLUTION
      // ==========================================
      const localSnapshotRaw = localStorage.getItem('app_auth_snapshot')
      
      if (localSnapshotRaw) {
        const snapshot = JSON.parse(localSnapshotRaw)
        
        // Hard evaluation window threshold limit (30-day structural expiration checkpoint)
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
        const isExpired = Date.now() - snapshot.timestamp > THIRTY_DAYS

        if (!isExpired) {
          // 🔒 PREMIUM GATEKEEPER SWITCH
          // Disconnect unauthorized/free tier entities immediately when disconnected from the network
          if (snapshot.tier === 'free') {
            setState({
              isLoading: false,
              isAuthorized: false, // 🛑 Booted out due to time out
              isOnline: false,
              tier: 'free',
              user: null,
              account: null,
              roster:[]
            })
            return
          }

          // 🟢 PAID USERS: Bypass network validation constraints seamlessly
          setState({
            isLoading: false,
            isAuthorized: true, 
            isOnline: false,
            tier: snapshot.tier,
            user: snapshot.user,
            account: snapshot.account,
            roster: snapshot.roster,
          })
          return
        }
      }

      // ==========================================
      // ❌ TIER 3: DENIED (Unauthenticated or Expired Snapshot)
      // ==========================================
      setState({
        isLoading: false,
        isAuthorized: false,
        isOnline: navigator.onLine,
        tier: null,
        user: null,
        account: null,
        roster:[]
      })
    }

    resolveAuthentication()

    return () => {
      window.removeEventListener('online', triggerRecheck)
      window.removeEventListener('offline', triggerRecheck)
    }
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

// Any component consuming a context re-renders when the context value changes
// useContext lets you read and subscribe to shared data from anywhere in the component tree
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be consumed strictly within an AuthProvider configuration wrapper.')
  }
  return context
}