import { useState, useEffect } from 'react';
import { useSession, getSession, signOut } from 'next-auth/react';
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
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [experience, setExperience] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { callbackUrl } = router.query;

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
      let updateError = null;
      
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
        const { error: metadataError } = await client.auth.updateUser({
          data: {
            name: firstName,
            dev_experience: experience,
            onboarding_completed: true,
          }
        });
        
        if (metadataError) {
          console.error('Supabase metadata update error:', metadataError);
          updateError = metadataError;
        } else {
          // Insert data into user_profiles table
          const { error: profileError } = await client
            .from('user_profiles')
            .upsert({
              id: session.user.id,
              first_name: firstName,
              dev_experience: experience,
              onboarding_completed: true,
            });

          if (profileError) {
            console.error('Supabase profile data error:', profileError);
            updateError = profileError;
          } else {
            console.log('User data updated successfully');
            updateSuccess = true;
          }
        }
      } catch (clientError) {
        console.error('Error using Supabase client:', clientError);
        updateError = clientError;
      }
      
      // If client-side update failed, try using a server-side API route
      if (!updateSuccess) {
        console.log('Trying server-side update fallback');
        
        try {
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
              onboardingData: {
                id: session.user.id,
                first_name: firstName,
                dev_experience: experience,
                onboarding_completed: true,
              },
            }),
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            console.error('Server-side update error:', data);
            throw new Error(data.message || 'Failed to update user data');
          }
          
          console.log('User data updated successfully via API:', data);
          updateSuccess = true;
        } catch (serverError: any) {
          console.error('Server API error:', serverError);
          updateError = serverError;
        }
      }
      
      if (!updateSuccess) {
        throw new Error(updateError?.message || 'Failed to update user data through all available methods');
      }
      
      // Show success message
      setShowSuccess(true);
      
      // Reset submission state
      setIsSubmitting(false);
      
      // Update the session to reflect the new metadata
      await updateSession({
        ...session,
        user: {
          ...session.user,
          metadata: {
            ...session.user.metadata,
            name: firstName,
            dev_experience: experience,
            onboarding_completed: true,
          }
        }
      });
      
      // Force a session refresh to ensure middleware gets updated data
      await getSession();
      
      // Force a hard redirect to dashboard after a brief delay
      // Use a more direct approach to bypass middleware for this navigation
      setTimeout(() => {
        // Check if there's a callback URL to redirect back to
        if (callbackUrl && typeof callbackUrl === 'string') {
          console.log('Redirecting to callback URL:', callbackUrl);
          // Use our special force-dashboard route that bypasses middleware
          window.location.href = `/api/auth/force-dashboard?userId=${session.user.id}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
        } else {
          // Use our special force-dashboard route that bypasses middleware
          window.location.href = `/api/auth/force-dashboard?userId=${session.user.id}`;
        }
      }, 1500);
      
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'An error occurred during onboarding');
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

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-200">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-gray-200 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 sm:text-sm"
                  placeholder="John"
                />
              </div>
              
              {/* Development Experience */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">
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
                          ? 'bg-green-900/50 border-green-500 text-green-300'
                          : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Claude API Key */}
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-200">
                  Claude API Key
                </label>
                <input
                  id="apiKey"
                  name="apiKey"
                  type="password"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-gray-200 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 sm:text-sm"
                  placeholder="sk-ant-api03-..."
                />
                <p className="mt-1 text-xs text-gray-400">
                  Your API key is stored locally and never sent to our servers.
                </p>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-black font-medium"
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