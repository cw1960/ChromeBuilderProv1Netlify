import { useSession, signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/router';
import { useState } from 'react';

interface DashboardHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function DashboardHeader({ title, description, children }: DashboardHeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      
      // First, call our custom sign-out endpoint to sign out from Supabase
      const response = await fetch('/api/auth/custom-signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Then use NextAuth's signOut to clear the session
        await signOut({ redirect: false });
        
        // Finally, redirect to the home page
        router.push('/');
      } else {
        console.error('Error signing out:', data.message);
        // Fallback to standard sign-out if custom endpoint fails
        signOut({ callbackUrl: '/' });
      }
    } catch (error) {
      console.error('Error during sign-out process:', error);
      // Fallback to standard sign-out
      signOut({ callbackUrl: '/' });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          {children}
        </div>
        <div className="flex items-center">
          <div className="mr-4 text-sm text-gray-600 dark:text-gray-300">
            {session?.user?.email}
          </div>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className={`px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center ${
              isSigningOut ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isSigningOut ? 'Signing Out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </header>
  );
} 