// utils/supabase/admin.ts
/// USED TO HANDLE STRIPE WEBHOOK STUFF. 
import { createClient } from '@supabase/supabase-js'

export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY!, // This is the secret one!
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}