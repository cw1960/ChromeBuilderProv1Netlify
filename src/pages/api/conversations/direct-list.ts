import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { projectId } = req.query;

  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({ message: 'Project ID is required' });
  }

  try {
    console.log(`DIRECT List Conversations API: Fetching conversations for project: ${projectId}`);
    
    // Create a direct Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    
    // Get the conversations
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('DIRECT List Conversations API: Error fetching conversations:', error);
      return res.status(500).json({ 
        message: 'Error fetching conversations',
        error: error.message
      });
    }
    
    console.log(`DIRECT List Conversations API: Found ${data ? data.length : 0} conversations for project ${projectId}`);
    
    return res.status(200).json({
      message: 'Conversations retrieved successfully',
      conversations: data || []
    });
  } catch (error) {
    console.error('DIRECT List Conversations API: Unexpected error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 