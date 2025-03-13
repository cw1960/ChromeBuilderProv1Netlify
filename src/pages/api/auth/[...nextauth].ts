import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { SupabaseAdapter } from '@next-auth/supabase-adapter';
import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Test user for development
const TEST_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  password: 'password123',
};

export const authOptions: NextAuthOptions = {
  providers: [
    // Email/Password credentials
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // For development: check if using test credentials
        if (process.env.NODE_ENV === 'development' && 
            credentials.email === TEST_USER.email && 
            credentials.password === TEST_USER.password) {
          return {
            id: TEST_USER.id,
            email: TEST_USER.email,
            name: TEST_USER.name,
          };
        }

        try {
          // Sign in with Supabase auth
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error || !data.user) return null;

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
    
    // Google OAuth provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    
    // GitHub OAuth provider
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
  ],
  
  // Use Supabase adapter to sync with Supabase Auth
  adapter: SupabaseAdapter({
    url: supabaseUrl,
    secret: supabaseServiceKey,
  }),
  
  // Custom session handling
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  callbacks: {
    // Add Supabase access token to session
    async session({ session, token }) {
      if (token?.sub && session.user) {
        session.user.id = token.sub;
        
        // Add user metadata to session
        if (token.user_metadata) {
          session.user.metadata = token.user_metadata;
        }
        
        // Skip Supabase session for test user
        if (token.sub !== TEST_USER.id) {
          try {
            // Get Supabase token and add to session
            const { data: { session: supabaseSession }, error } = 
              await supabase.auth.getSession();
              
            if (!error && supabaseSession) {
              session.supabaseAccessToken = supabaseSession.access_token;
            }
          } catch (error) {
            console.error('Error getting Supabase session:', error);
          }
        }
      }
      return session;
    },
    
    // Add user details to JWT token
    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (account && user) {
        // If signing in with OAuth and not test user, link account with Supabase
        if (account.provider !== 'credentials' && user.id !== TEST_USER.id) {
          await linkProviderToSupabase(account, user, token);
        }
        
        // Add user details to token
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      
      // Always fetch fresh metadata from Supabase on every token refresh
      if (token.sub && token.sub !== TEST_USER.id) {
        try {
          console.log('JWT callback - Fetching fresh user metadata');
          const { data: { user: supabaseUser } } = await supabase.auth.getUser();
          if (supabaseUser) {
            console.log('JWT callback - User metadata:', supabaseUser.user_metadata);
            token.user_metadata = supabaseUser.user_metadata || {};
          }
        } catch (error) {
          console.error('Error getting user metadata:', error);
        }
      }
      
      return token;
    },
    
    // Redirect to dashboard after sign in
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after sign in
      if (url.startsWith(baseUrl)) {
        // Check if user has completed onboarding
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          // Skip onboarding check for test user
          if (user && user.id !== TEST_USER.id) {
            // Check if user has completed onboarding
            const hasCompletedOnboarding = user.user_metadata?.onboarding_completed === true;
            
            if (!hasCompletedOnboarding) {
              return `${baseUrl}/onboarding`;
            }
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        }
        
        return `${baseUrl}/dashboard`;
      }
      // Redirect to requested URL if on same site
      else if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allow redirects to external URLs
      return url;
    },
  },
  
  pages: {
    signIn: '/auth/signin',
    signOut: '/',
    error: '/auth/error',
  },
  
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Link OAuth provider to Supabase account
 */
async function linkProviderToSupabase(account: any, user: any, token: any) {
  try {
    // Check if user exists in Supabase
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (userError && !existingUser) {
      // Create user in Supabase if they don't exist
      const { error: createError } = await supabase.auth.admin.createUser({
        email: user.email,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          provider: account.provider,
        },
        id: user.id,
      });
      
      if (createError) {
        console.error('Error creating user in Supabase:', createError);
      }
    }
  } catch (error) {
    console.error('Error linking provider to Supabase:', error);
  }
}

// Extend the Session type to include Supabase access token
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      metadata?: {
        name?: string;
        dev_experience?: string;
        onboarding_completed?: boolean;
        [key: string]: any;
      };
    };
    supabaseAccessToken?: string;
  }
  
  interface JWT {
    user_metadata?: {
      name?: string;
      dev_experience?: string;
      onboarding_completed?: boolean;
      [key: string]: any;
    };
  }
}

export default NextAuth(authOptions);