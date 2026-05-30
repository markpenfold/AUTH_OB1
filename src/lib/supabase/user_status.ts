import { createClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js';


// 1. Define the exact shape your specific query returns
type MemberPlanResponse = {
  accounts: {
    plan_name: string
  } | null
}


export async function updateOfflineUserStatus(user: User) {

    const supabase = await createClient()
    // When the app initializes or refreshes online
    const { data } = await supabase
    .from('members')
    .select('accounts(plan_name)')
    .eq('user_id', user.id)
    .single()

    const userData = data as unknown as MemberPlanResponse
    const planName = userData?.accounts?.plan_name || 'free';

    // Store this inside Supabase user metadata so it persists inside 
    // the local offline session object automatically
    await supabase.auth.updateUser({
    data: { current_plan: planName }
    });
    
}