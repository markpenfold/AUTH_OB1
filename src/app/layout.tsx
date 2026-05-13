import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/styles/globals.css";
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SiteNav } from '@/components/SiteNav';
import { createClient } from '@/lib/supabase/server'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OmenLand Home Page",
  description: "History in the making",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const cookieStore = await cookies()
  const supabase = await createClient()
  
  // Always use getUser() not getSession() — getUser() validates with Supabase server
  const { data: { user } } = await supabase.auth.getUser()
  // 2. Initialize profile as null
  let profile = null

  // 3. If we have a user, go get their row from the 'profiles' table
  if (user) {
    const { data } = await supabase
      .from('users') // Replace with your actual table name
      .select('*')
      .eq('id', user.id)
      .single()
    
    profile = data;
   // console.log("full name:", data.full_name);
    
  }
  
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <SiteNav  user={user} profile={profile} />
        {children}
        
        </body>
    </html>
  );
}



