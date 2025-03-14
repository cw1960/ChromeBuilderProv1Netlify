import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';
import { supabase } from '@/lib/supabase-mcp';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the current session
    const session = await getServerSession(req, res, authOptions);
    
    // Log the sign-out attempt
    console.log('Custom sign-out initiated', { 
      hasSession: !!session,
      userId: session?.user?.id 
    });

    // Sign out from Supabase first
    await supabase.auth.signOut();
    console.log('Supabase sign-out completed');
    
    // Redirect to the home page
    return res.status(200).json({ success: true, redirectUrl: '/' });
  } catch (error) {
    console.error('Error during custom sign-out:', error);
    return res.status(500).json({ 
      message: 'Error signing out',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 