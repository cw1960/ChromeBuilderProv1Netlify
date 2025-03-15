import Link from 'next/link';

export default function ServerErrorContent() {
  return (
    <div className="w-full space-y-8">
      <div className="rounded-md bg-red-50 p-4 text-red-800">
        <p>Something went wrong on our end. Please try again later.</p>
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