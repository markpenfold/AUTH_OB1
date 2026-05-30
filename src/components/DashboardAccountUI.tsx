import { cookies } from 'next/headers'
import { DataAccessPanel } from '@/components/dashboard/data/DataAccessPanel'
import Link from 'next/link'
import classes from '@/app/styles/styles.module.css'
import  AvatarUpload  from '@/components/AvatarUpload'
import type { User} from '@supabase/supabase-js'
import type {Account, DashboardAccountProps} from '@/lib/types'
import { createClient } from '@/lib/supabase/server'
import { getAccountOwner } from '@/lib/supabase/queries'
import { ClientDashboardLoader } from './ClientDashboardLoader'


export async function DashboardAccountUI({ accountId, message, session_id }:DashboardAccountProps) {

  const supabase = await createClient()

  const { data: account } = await supabase.from('accounts').select('*').eq('id', accountId).single()
    if (!account) return <div>Account not found</div>
  // 1. Get current logged-in user details
  const { data: { user } } = await supabase.auth.getUser()
  // 2. Run our master relational query
  const ownerProfile = await getAccountOwner(accountId)
  if (!user || !ownerProfile) {
    return <p>Loading account details...</p>
  }

  const isOwner = user.email === ownerProfile
  const isTeam = account.plan_name === 'team'

  // handle potential race condition between stripe return and db update
  if (session_id && account.plan_name === 'free') {
    return <ClientDashboardLoader session_id={session_id} />
  }
 
  return (
    <div>
      {message && (
        <div style={{ color: 'green', padding: '10px', border: '1px solid green' }}>
          {message}
        </div>
      )}
      {/* Always visible */}
      <p className={classes.gapBig}>================== accounts from here ==============================</p>
      <div  className={classes.accBox}>
        <h1 className={classes.accountHeader}>Details for {account.name} account</h1>
            
        {isOwner && !isTeam && (
          <div className={classes.container3Cols}>
          
                

                <div><h3>Plan type:</h3></div>
                <div><h3>{account.plan_name}</h3></div>
                <div></div>

            <div><h3>Manage your account</h3></div>
              <div><h3></h3></div>
              <div></div>

          <div><h3>Account name</h3></div>
          <div><h3>{account.name}</h3></div>
          <div><Link className={classes.buttonClass} href="/">Change</Link></div>


          <div><h3>Upgrade your account</h3></div>
          <div></div>
          <div><Link className={classes.buttonClass} href="/pricing">Upgrade</Link></div>
          
              
          <div><h3>Cancel your account</h3></div>
          <div></div>
          <div><Link className={classes.buttonClass} href="/pricing">Cancel</Link></div>
          
          <div><h3>Pause your account</h3></div>
          <div></div>
          <div><Link className={classes.buttonClass} href="/pricing">Pause</Link></div>
          
          </div>
              
          )}
            
              {!isOwner && isTeam &&(
          <div className={classes.container3Cols}>
            <div>
              <h3>Account admin</h3></div>
                <div><h3>{ownerProfile}</h3></div>
                <div><Link className={classes.buttonClass} href="/pricing">Contact</Link></div>
   
                <div><h3>Account name</h3></div>
                <div><h3>{account.name}</h3></div>

              <div><h3>Team Members</h3></div>
              <div> List of team members here</div>
              <div><h3>Invite new user to join your team</h3></div>
              <div><button className={classes.buttonClass} >Invite</button></div>
            </div>
          )}
          
                

                {/* Conditionally render the cancellation section ONLY for the owner */}
          {isOwner && isTeam &&(
            <>
            <div className={classes.container3Cols}>

              <div><h3>Account name</h3></div>
                <div><h3>{account.name}</h3></div>
                <div><Link className={classes.buttonClass} href="/pricing">Change</Link></div>

            <div><h3>Plan</h3></div>
                <div><h3>{account.plan_name}</h3></div>
                <div><Link className={classes.buttonClass} href="/pricing">Upgrade</Link></div>

            <div><h3>Manage your account</h3></div>
              <div><h3></h3></div>
              <div><button className={classes.buttonClass} >Cancel</button></div>

            </div>

            <div className={classes.container3Cols}><h3>Team Members</h3>
                <div> List of team members here</div>
                <div></div>
                  <div><h3>Invite new user to join your team</h3></div>
                  <div><button className={classes.buttonClass} >Invite</button></div>
            </div>
              </>

          )}

            </div>
        </div>
   
  )
}