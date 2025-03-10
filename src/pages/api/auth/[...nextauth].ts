import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { SupabaseAdapter } from '@next-auth/supabase-adapter';
import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Initialize Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
        
        // Get Supabase token and add to session
        const { data: { session: supabaseSession }, error } = 
          await supabase.auth.getSession();
          
        if (!error && supabaseSession) {
          session.supabaseAccessToken = supabaseSession.access_token;
        }
      }
      return session;
    },
    
    // Add user details to JWT token
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        // If signing in with OAuth, link account with Supabase
        if (account.provider !== 'credentials') {
          await linkProviderToSupabase(account, user, token);
        }
        
        return {
          ...token,
          name: user.name,
          email: user.email,
          picture: user.image,
        };
      }
      
      return token;
    },
  },
  
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/dashboard/welcome',
  },
  
  debug: process.env.NODE_ENV === 'development',
};

// Helper function to link OAuth accounts with Supabase
async function linkProviderToSupabase(account: any, user: any, token: any) {
  try {
    // Check if user exists in Supabase
    const { data: existingUser, error: userError } = 
      await supabase.auth.admin.getUserById(token.sub);
      
    if (userError || !existingUser?.user) {
      // Create new user in Supabase if doesn't exist
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          provider: account.provider,
          provider_id: account.providerAccountId,
        },
      });
      
      if (error) {
        console.error('Error creating Supabase user:', error);
      }
    }
  } catch (error) {
    console.error('Error linking provider to Supabase:', error);
  }
}

// Extend next-auth session type to include Supabase token
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    supabaseAccessToken?: string;
  }
}

export default NextAuth(authOptions);