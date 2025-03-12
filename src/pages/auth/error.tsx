import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function ErrorPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { error } = router.query;
    if (typeof error === 'string') {
      setError(error);
    }
  }, [router.query]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>Authentication Error | ChromeBuilder Pro</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Authentication Error</h1>
        
        {error ? (
          <div className="mb-6">
            <p className="text-xl mb-2">Error: {error}</p>
            <p className="text-muted-foreground">
              There was a problem with your sign-in attempt.
            </p>
          </div>
        ) : (
          <p className="text-xl mb-6">
            There was a problem with your sign-in attempt.
          </p>
        )}
        
        <div className="flex space-x-4">
          <Link
            href="/"
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Return to Home
          </Link>
          
          <button
            onClick={() => router.back()}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent"
          >
            Go Back
          </button>
        </div>
      </main>
    </div>
  );
} 