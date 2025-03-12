import { useState, useEffect } from 'react';
import { useSession, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase, createSupabaseClient } from '@/lib/supabase';

// UI Components
import { Button } from '@/components/ui';

// Development experience options
const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

export default function Onboarding() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [experience, setExperience] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (mounted && status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [mounted, status, router]);

  // Redirect if already completed onboarding
  useEffect(() => {
    if (mounted && status === 'authenticated' && session?.user?.metadata?.onboarding_completed) {
      router.push('/dashboard');
    }
  }, [mounted, status, session, router]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for session
    if (!session || !session.user || !session.user.id) {
      setError('Auth session missing! Please sign in again.');
      console.error('Session data:', session);
      return;
    }
    
    // Validate form
    if (!firstName.trim()) {
      setError('Please enter your first name');
      return;
    }
    
    if (!experience) {
      setError('Please select your development experience');
      return;
    }
    
    if (!apiKey.trim() || !apiKey.startsWith('sk-ant-')) {
      setError('Please enter a valid Claude API key (starts with sk-ant-)');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      console.log('Saving onboarding data for user:', session.user.id);
      
      // Store API key in localStorage
      localStorage.setItem('claude_api_key', apiKey);
      
      // Get the Supabase access token from the session
      const supabaseAccessToken = session.supabaseAccessToken;
      console.log('Supabase access token available:', !!supabaseAccessToken);
      
      let updateSuccess = false;
      
      // Try to update user metadata using Supabase client
      try {
        // Use the appropriate Supabase client
        let client = supabase;
        if (supabaseAccessToken) {
          client = createSupabaseClient(supabaseAccessToken);
          console.log('Using authenticated Supabase client');
        } else {
          console.log('Using anonymous Supabase client');
        }
        
        // Update user metadata in Supabase
        const { data: userData, error: updateError } = await client.auth.updateUser({
          data: {
            name: firstName,
            dev_experience: experience,
            onboarding_completed: true,
          }
        });
        
        if (updateError) {
          console.error('Supabase client update error:', updateError);
          // Don't throw, we'll try the API route fallback
        } else {
          console.log('User data updated successfully via client:', userData);
          updateSuccess = true;
        }
      } catch (clientError) {
        console.error('Error using Supabase client:', clientError);
        // Continue to fallback
      }
      
      // If client-side update failed, try using a server-side API route
      if (!updateSuccess) {
        console.log('Trying server-side update fallback');
        
        // Create a server-side API route to update user metadata
        const response = await fetch('/api/update-user-metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: session.user.id,
            metadata: {
              name: firstName,
              dev_experience: experience,
              onboarding_completed: true,
            },
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Server-side update error:', errorData);
          throw new Error(errorData.message || 'Failed to update user metadata');
        }
        
        const data = await response.json();
        console.log('User data updated successfully via API:', data);
        updateSuccess = true;
      }
      
      if (!updateSuccess) {
        throw new Error('Failed to update user metadata through all available methods');
      }
      
      // Show success message
      setShowSuccess(true);
      
      // Redirect to dashboard after 1.5 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'An error occurred during onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking session
  if (!mounted || status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-2">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>Welcome to ChromeBuilder Pro</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex w-full flex-1 flex-col items-center justify-center px-4 sm:px-20">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                ChromeBuilder Pro
              </span>
            </h1>
            <h2 className="mt-6 text-3xl font-bold">Welcome!</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Let's set up your account to get started
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/50 dark:text-red-300">
              <p>{error}</p>
              {error.includes('Auth session') && (
                <div className="mt-2 text-sm">
                  <p>Try refreshing the page or signing in again.</p>
                  <button 
                    onClick={() => router.push('/auth/signin')}
                    className="mt-2 text-red-600 dark:text-red-400 underline"
                  >
                    Go to Sign In
                  </button>
                </div>
              )}
            </div>
          )}
          
          {showSuccess && (
            <div className="rounded-md bg-green-50 p-4 text-green-800 dark:bg-green-900/50 dark:text-green-300">
              <p>Setup complete! Redirecting to dashboard...</p>
            </div>
          )}

          {/* Debug info - only shown in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-xs overflow-auto max-h-40">
              <h3 className="font-bold mb-2">Debug Info:</h3>
              <p>Auth Status: {status}</p>
              <p>Session Available: {session ? 'Yes' : 'No'}</p>
              <p>User ID: {session?.user?.id || 'Not available'}</p>
              <p>Supabase Token: {session?.supabaseAccessToken ? 'Available' : 'Not available'}</p>
              <details>
                <summary>Session Data</summary>
                <pre>{JSON.stringify(session, null, 2)}</pre>
              </details>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4 rounded-md shadow-sm">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                  placeholder="John"
                />
              </div>
              
              {/* Development Experience */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Development Experience
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setExperience(level.id)}
                      className={`px-4 py-2 rounded-md border ${
                        experience === level.id
                          ? 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/50 dark:border-blue-400 dark:text-blue-300'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Claude API Key */}
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium">
                  Claude API Key
                </label>
                <input
                  id="apiKey"
                  name="apiKey"
                  type="password"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                  placeholder="sk-ant-api03-..."
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Your API key is stored locally and never sent to our servers.
                </p>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 