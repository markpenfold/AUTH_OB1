// src/components/providers/OfflineHydrationGuard.tsx
'use client'

import { useEffect } from 'react'
import { getOfflineHydrationKit } from '@/actions/hydrate'
import { seedOfflineEngine } from '@/lib/auth/hydrate_user'

export function BillingSyncListener() {
  useEffect(() => {
    // 1. Check if the middleware dropped the synchronization directive
    const matchesSyncSignal = document.cookie.split('; ').find(row => row.startsWith('x-sync-local-storage='))
    
    if (matchesSyncSignal) {
      async function runHotSwap() {
        console.log('[Local-First Core] Billing change detected by proxy. Syncing local storage...')
        
        const result = await getOfflineHydrationKit()
        
        if (result.success && result.payload) {
          // 2. Silently update local storage parameters and cryptographic leases
          seedOfflineEngine(result.payload)
          
          // 3. Document cookie cleanup: Clear the flag immediately
          document.cookie = 'x-sync-local-storage=; max-age=0; path=/;'
          
          console.log('[Local-First Core] Local workspace environment updated successfully.')
        }
      }

      runHotSwap()
    }
  }, [])

  return null // Purely functional background listener component
}