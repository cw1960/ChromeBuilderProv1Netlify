import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the session
    const session = await getServerSession(req, res, authOptions);
    
    // Return session data (or null if not authenticated)
    res.status(200).json({
      authenticated: !!session,
      session,
      sessionKeys: session ? Object.keys(session) : [],
      userKeys: session?.user ? Object.keys(session.user) : [],
      userId: session?.user?.id || null,
    });
  } catch (error) {
    console.error('Error in debug session endpoint:', error);
    res.status(500).json({ error: 'Failed to get session data' });
  }
} 