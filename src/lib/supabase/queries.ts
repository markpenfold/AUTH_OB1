import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'

// Using 'cache' ensures that if you call this 3 times in 
// one request, it only hits the database ONCE.
export const getProfile = cache(async () => {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

console.log("wtffffff?", user.id)
  const { data: profile } = await supabase
    .from('profiles') // Ensure this matches your table name
    .select('id, full_name, has_avatar, username')
    .eq('id', user.id)
    .single()
  console.log("getP is finding:", profile)
  return profile
})