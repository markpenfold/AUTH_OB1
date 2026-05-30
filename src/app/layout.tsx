import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/styles/globals.css";
import { SiteNav } from '@/components/SiteNav';
import { AuthProvider } from "./auth/context/AuthContext";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        {/* 🌐 Wrap everything in the Auth Context Core */}
        <AuthProvider>
          <SiteNav /> {/* No more props needed! */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}