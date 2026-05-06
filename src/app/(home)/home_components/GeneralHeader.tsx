// components/dashboard/GeneralHeader.tsx
import Link from 'next/link';
import { CircleIcon, Home, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/(login)/actions';
import { User } from '@/lib/db/schema';

interface GeneralHeaderProps {
  user: User | null; // User is passed from server layout
}

function UserMenu({ user }: { user: User }) {

  const getUserInitials = () => {
    const name = user?.name || user?.email || 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
<>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user?.avatarUrl ?? undefined} 
              alt={user?.name ?? 'User'} 
            />
            <AvatarFallback className="text-lg">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          {/* Only show initials if avatar URL exists */}
          {user?.avatarUrl && (
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              {getUserInitials()}
            </span>
          )}
        </div>
   
          <Link href="/dashboard" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
 
        <form action={signOut} className="w-full">
          <button type="submit" className="flex w-full">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
           
          </button>
        </form>
</>
  );
}

function GuestMenu() {
  return (
    <div className="flex items-center gap-6">
      <Link href="/sign-in">Login</Link>
      <Link href="/sign-up">Sign up</Link>
      <Link href="/about">About</Link>
      <Link href="/blog">Blog</Link>
    </div>
  );
}

export function GeneralHeader({ user }: GeneralHeaderProps) {
  return (
    <header className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <CircleIcon className="h-6 w-6 rgb(30,30,30)" />
          <span className="ml-2 text-xl font-semibold text-gray-900">
            
          </span>
        </Link>
       <div className="flex items-center space-x-4">
          {user ? <UserMenu user={user} /> : <GuestMenu />}
        </div>
      </div>
    </header>
  );
}