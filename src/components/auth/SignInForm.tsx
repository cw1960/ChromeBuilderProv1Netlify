import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/hooks/useAuth';

export default function SignInForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { mounted, handleSignIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!mounted) {
    return null;
  }

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (session) {
    router.push('/dashboard');
    return null;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await handleSignIn(email, password);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
} 