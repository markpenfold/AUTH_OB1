import { createServerClient, type CookieOptions  } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SliceExplorer } from "./SliceExplorer"

// This is still a Server Component — no directive needed
// It fetches the slice catalogue the user is entitled to
export async function DataAccessPanel({ 
  userId, 
  tier 
}: { 
  userId: string
  tier: string 
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // In a Server Component, setting cookies can fail.
            // Supabase docs/discussions note this can be ignored if session refresh is handled elsewhere.
          }
        },
      },
    }
  )

  // Get slices this tier can access — RLS + tier filter
  const { data: availableSlices, error } = await supabase
    .from('data_slices')
    .select('id, name, description, date_range, row_count, size_mb')
    .eq('required_tier', tier)   // or use .lte() if tiers are numeric levels
    .eq('is_active', true)
    .order('name')

  if (error) {
    throw new Error(error.message)
  }

  // Pass only metadata — no URLs yet, those come when user selects a slice
  return (
    <SliceExplorer 
      slices={availableSlices ?? []} 
      userId={userId}
    />
  )
}