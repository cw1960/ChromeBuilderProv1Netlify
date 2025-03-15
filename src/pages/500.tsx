import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Custom500() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>500 - Server Error | ChromeBuilder Pro</title>
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
            <h2 className="mt-6 text-3xl font-bold">Server Error</h2>
          </div>
          <div className="w-full space-y-8">
            <div className="rounded-md bg-red-50 p-4 text-red-800">
              <p>Something went wrong on our end. Please try again later.</p>
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-primary hover:text-primary/80"
              >
                Return to home
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 