import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';

export function useAuth() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        return { error: result.error === 'CredentialsSignin' ? 'Invalid email or password' : result.error };
      }

      return { success: true };
    } catch (err) {
      console.error('Sign in error:', err);
      return { error: 'An unexpected error occurred' };
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        return { error: 'Error signing in after registration' };
      }

      return { success: true };
    } catch (err) {
      console.error('Sign up error:', err);
      return { error: err instanceof Error ? err.message : 'An unexpected error occurred' };
    }
  };

  return {
    mounted,
    handleSignIn,
    handleSignUp,
  };
} 