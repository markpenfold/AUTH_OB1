// src/actions/hydrate.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { generateOfflineLeaseJwt } from '@/lib/auth/crypto'

/**
 * Called by the client shell whenever local storage needs 
 * to be built or rebuilt from a valid server session.
 */
export async function getOfflineHydrationKit() {
  const supabase = await createClient()

  // Verify the browser has a valid server-side session cookie
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized session' }
  }

  // Single-request joined fetch for Profile and Workspace layouts
  const { data: userRecord, error: fetchError } = await supabase
    .from('profiles')
    .select(`
      *,
      memberships (
        account_id,
        role,
        accounts (
          id,
          name,
          slug
        )
      )
    `)
    .eq('id', user.id)
    .single()

  if (fetchError || !userRecord) {
    return { error: 'Failed to build local storage environment' }
  }

  const { memberships = [], ...profile } = userRecord
  const currentTier = profile?.tier || 'free'

  // Generate their untamperable lease
  const offlineLeaseJwt = await generateOfflineLeaseJwt({
    userId: user.id,
    tier: currentTier,
    version: 1
  })

  return {
    success: true,
    payload: {
      user,
      profile,
      memberships,
      offlineLeaseJwt
    }
  }
}