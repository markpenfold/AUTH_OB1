import { cookies } from 'next/headers'
import { DataAccessPanel } from '@/components/dashboard/data/DataAccessPanel'
import Link from 'next/link'
import classes from '@/app/styles/styles.module.css'
import  AvatarUpload  from '@/components/AvatarUpload'
import type { User} from '@supabase/supabase-js'
import type {Account, DashboardAccountProps} from '@/lib/types'
import { createClient } from '@/lib/supabase/server'

export async function DashboardAccountUI({ user, accountId, message }:DashboardAccountProps) {


  const supabase = await createClient()
  const { data: account } = await supabase.from('accounts').select('*').eq('id', accountId).single()
    if (!account) return <div>Account not found</div>

  return (
    <div>
     
      {message && (
        <div style={{ color: 'green', padding: '10px', border: '1px solid green' }}>
          {message}
        </div>
      )}
      {/* Always visible */}
      <div  className={classes.accBox}>
        <h1 className={classes.accountHeader}>Details for {account.plan_name} account</h1>
            <div>
                <h3>{account.name}</h3>
                <p>Plan: </p>
            </div>
      </div>
    
      </div> 
  )
}