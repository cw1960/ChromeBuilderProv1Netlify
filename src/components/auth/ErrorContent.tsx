import Link from 'next/link';

export default function ErrorContent() {
  return (
    <div className="w-full space-y-8">
      <div className="rounded-md bg-red-50 p-4 text-red-800">
        <p>There was an issue with your sign-in attempt. Please try again.</p>
      </div>
      <div className="mt-6 text-center space-y-4">
        <div>
          <Link href="/auth/signin" legacyBehavior>
            <a className="text-sm text-primary hover:text-primary/80">
              Try signing in again
            </a>
          </Link>
        </div>
        <div>
          <Link href="/" legacyBehavior>
            <a className="text-sm text-primary hover:text-primary/80">
              Return to home
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
} 