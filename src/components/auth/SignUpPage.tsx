import Head from 'next/head';
import SignUpForm from './SignUpForm';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>Sign Up | ChromeBuilder Pro</title>
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
            <h2 className="mt-6 text-3xl font-bold">Create your account</h2>
          </div>
          <SignUpForm />
        </div>
      </main>
    </div>
  );
} 