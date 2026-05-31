import "@/app/styles/globals.css";
import { SiteNav } from '@/components/SiteNav';
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/queries'
import { AuthProvider } from "./auth/context/AuthContext"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  
  // 1. Validate user securely on the server
  const { data: { user } } = await supabase.auth.getUser()
  
  // 2. Fetch profile if user exists
  let profile = null
  if (user) {
    profile = await getProfile()
  }
  
  return (
    <html lang="en">
      <body>
        {/* 🌟 Pass the server data directly into the client provider */}
        <AuthProvider serverUser={user} serverProfile={profile}>
          <SiteNav initialUser={user} initialProfile={profile}/>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}