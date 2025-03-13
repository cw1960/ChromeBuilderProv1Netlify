import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const loading = status === 'loading' || !mounted;

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (mounted && status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [mounted, status, router]);

  const handleSignIn = () => {
    router.push('/auth/signin');
  };

  const handleSignUp = () => {
    router.push('/auth/signup');
  };

  const handleDevBypass = () => {
    // Only show in development mode
    if (process.env.NODE_ENV === 'development') {
      router.push('/api/auth/dev-bypass');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>ChromeBuilder Pro</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
        <h1 className="text-6xl font-bold">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            ChromeBuilder Pro
          </span>
        </h1>

        <p className="mt-3 text-2xl">
          Build Chrome Extensions with AI assistance
        </p>

        <div className="mt-8 flex justify-center space-x-4">
          {loading ? (
            <div className="animate-pulse rounded-md bg-gray-300 h-10 w-40"></div>
          ) : !session ? (
            <div className="flex space-x-4">
              <button
                onClick={handleSignIn}
                className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Sign In
              </button>
              <button
                onClick={handleSignUp}
                className="rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Sign Up
              </button>
              
              {/* Development mode bypass button */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={handleDevBypass}
                  className="rounded-md bg-purple-500 px-4 py-2 text-white hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  Dev Mode (Skip Auth)
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <p>
                Signed in as {session.user?.name || session.user?.email}
              </p>
              
              <div className="flex space-x-4">
                <Link
                  href="/dashboard"
                  className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Go to Dashboard
                </Link>
                
                <button
                  onClick={() => signOut()}
                  className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border p-6">
            <h3 className="text-xl font-bold">AI-Powered Development</h3>
            <p className="mt-2 text-muted-foreground">
              Build Chrome extensions faster with AI assistance at every step
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="text-xl font-bold">Modern Tools</h3>
            <p className="mt-2 text-muted-foreground">
              Use the latest Chrome APIs and development best practices
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="text-xl font-bold">Easy Deployment</h3>
            <p className="mt-2 text-muted-foreground">
              Package and publish your extensions with just a few clicks
            </p>
          </div>
        </div>
      </main>

      <footer className="flex h-24 w-full items-center justify-center border-t">
        <p>
          Powered by{' '}
          <span className="font-bold">Claude 3.7 Sonnet</span>
        </p>
      </footer>
    </div>
  );
}