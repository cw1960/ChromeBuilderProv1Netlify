import Link from 'next/link';

export default function NotFoundContent() {
  return (
    <div className="w-full space-y-8">
      <div className="rounded-md bg-gray-50 p-4 text-gray-800">
        <p>The page you're looking for doesn't exist or has been moved.</p>
      </div>
      <div className="mt-6 text-center">
        <Link href="/" legacyBehavior>
          <a className="text-sm text-primary hover:text-primary/80">
            Return to home
          </a>
        </Link>
      </div>
    </div>
  );
} 