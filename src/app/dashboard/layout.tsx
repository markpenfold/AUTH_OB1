// app/dashboard/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { WorkspaceDropdownSwitcher } from '@/components/WorkspaceDropdownSwitcher'
import { DashboardUser } from '@/components/DashboardUser'
import { redirect } from 'next/navigation'
import classes from '@/app/styles/styles.module.css'



export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  // Read our routing cookie to see if we need to show a workspace dropdown selector next to the avatar
  const cookieStore = await cookies()
  const context = cookieStore.get('user_workspace_context')
  const { count } = context ? JSON.parse(context.value) : { count: 0 }

  return (
    <div className="dashboard-container">
      {/* --- PART 1: USER DETAILS SIDEBAR/HEADER --- */}
      <header className="user-profile-header">
        <h1>Welcome to your dashboard, {user?.user_metadata.full_name}</h1>
        <hr/>
        <br></br>
        <DashboardUser user={user}/>
        {/* If they have multiple accounts, render a dropdown switcher right here */}
        {count > 1 && <WorkspaceDropdownSwitcher />}
      </header>

      {/* --- PART 2: DYNAMIC CONTENT AREA --- */}
      <main className="content-body">
        
        <p className={classes.gapBig}>================== accounts from here ==============================</p>
        {children} {/* This swaps between the Picker Grid and the actual Workspace Data */}
      </main>
    </div>
  )
}