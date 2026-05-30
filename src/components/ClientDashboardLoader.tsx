'use client'
import type {DashboardLoaderProps} from '@/lib/types'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

/////////////////////////////////////////////////////////////////
// Designed to catch the race condition where 
// Stripe sends us back a session id
// But the db has not caught up
/////////////////////////////////////////////////////////////////
export async function ClientDashboardLoader({ session_id }:DashboardLoaderProps) {
    const router = useRouter()
    const [retryCount, setRetryCount] = useState(0)
    const [gaveUp, setGaveUp] = useState(false)

    const MAX_RETRIES = 5 // 5 retries * 2 seconds = 10-second absolute cutoff
    // Boot up the database context instantly on page-load
    useEffect(() => {

        if (retryCount >= MAX_RETRIES) {
         setGaveUp(true)
        return
        }

        //re-runs src/app/dashboard/page.tsx
        // Ping your Next.js Server Component every 2 seconds to check the DB
        const interval = setInterval(() => {
        setRetryCount((prev) => prev + 1)
        router.refresh() // ⚡ Re-runs the server component to see if plan_name changed
        }, 2000)

        return () => clearInterval(interval)
      
    }, [retryCount, router]);
  
 if (gaveUp) {
    return (
      <div className="p-8 max-w-md mx-auto mt-20 text-center border rounded-xl bg-amber-50 border-amber-200">
        <h3 className="font-bold text-amber-900 mb-2">Taking longer than usual...</h3>
        <p className="text-sm text-amber-800 mb-4">
          We confirmed your payment, but our system is still provisioning your premium workspace.
        </p>
        <button 
          onClick={() => window.location.href = '/dashboard'} // Strip the session_id from URL
          className="bg-amber-900 text-white text-sm px-4 py-2 rounded-lg font-medium"
        >
          Go to Dashboard anyway
        </button>
      </div>
    )
  }

  // Standard elegant loading state while we wait for the webhook
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        {/* Replace this with your standard loading spinner */}
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-xl font-semibold">Finalizing your workspace setup...</h2>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          We are securely linking your payment to your account. This takes just a moment.
        </p>
      </div>
    </div>
  )
}