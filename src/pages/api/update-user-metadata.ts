import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Initialize Supabase admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the session to verify the user is authenticated
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get request body
    const { userId, metadata } = req.body;

    // Verify the user is updating their own metadata
    if (session.user.id !== userId) {
      return res.status(403).json({ message: 'Forbidden: Cannot update metadata for another user' });
    }

    console.log('Server: Updating metadata for user:', userId);
    console.log('Server: Metadata to update:', metadata);

    // Update user metadata using admin client
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: metadata }
    );

    if (error) {
      console.error('Server: Error updating user metadata:', error);
      return res.status(500).json({ message: error.message });
    }

    console.log('Server: User metadata updated successfully:', data);
    return res.status(200).json({ success: true, user: data.user });
  } catch (error: any) {
    console.error('Server: Unexpected error:', error);
    return res.status(500).json({ message: error.message || 'An unexpected error occurred' });
  }
} 