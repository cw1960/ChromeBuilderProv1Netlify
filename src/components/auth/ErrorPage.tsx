import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function ErrorPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>Authentication Error | ChromeBuilder Pro</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                ChromeBuilder Pro
              </span>
            </h1>
            <h2 className="mt-6 text-3xl font-bold">Authentication Error</h2>
          </div>
          <div className="w-full space-y-8">
            <div className="rounded-md bg-red-50 p-4 text-red-800">
              <p>There was an issue with your sign-in attempt. Please try again.</p>
            </div>
            <div className="mt-6 text-center space-y-4">
              <div>
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="text-sm text-primary hover:text-primary/80"
                >
                  Try signing in again
                </button>
              </div>
              <div>
                <button
                  onClick={() => router.push('/')}
                  className="text-sm text-primary hover:text-primary/80"
                >
                  Return to home
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
