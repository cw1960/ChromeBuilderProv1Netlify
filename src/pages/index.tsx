import { useSession, signIn, signOut } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

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

        <div className="mt-8 flex justify-center">
          {loading && <div>Loading...</div>}
          
          {!loading && !session && (
            <button
              onClick={() => signIn()}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Sign in to get started
            </button>
          )}
          
          {session && (
            <div className="flex flex-col items-center space-y-4">
              <p>
                Signed in as {session.user?.name} ({session.user?.email})
              </p>
              
              <div className="flex space-x-4">
                <Link
                  href="/dashboard"
                  className="rounded-md bg-primary px-4 py-2 text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  Go to Dashboard
                </Link>
                
                <button
                  onClick={() => signOut()}
                  className="rounded-md bg-destructive px-4 py-2 text-destructive-foreground shadow-sm hover:bg-destructive/90"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
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