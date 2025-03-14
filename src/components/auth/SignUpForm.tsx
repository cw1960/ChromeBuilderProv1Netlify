import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function SignUpForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { callbackUrl } = router.query;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (mounted && status === 'authenticated' && session) {
      router.push(callbackUrl ? String(callbackUrl) : '/dashboard');
    }
  }, [mounted, status, session, router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // Create account
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create account');
      }

      // Sign in with new credentials
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        // Redirect to callback URL or dashboard
        router.push(callbackUrl ? String(callbackUrl) : '/dashboard');
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  // Show loading state while checking session
  if (!mounted || status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-800">
          <p>{error}</p>
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4 rounded-md shadow-sm">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              placeholder="test@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              placeholder="password123"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              placeholder="password123"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex w-full justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-primary hover:text-primary/80">
            Sign in
          </Link>
        </p>
        <Link href="/" className="text-sm text-primary hover:text-primary/80 block mt-2">
          Return to home
        </Link>
      </div>
    </div>
  );
} 