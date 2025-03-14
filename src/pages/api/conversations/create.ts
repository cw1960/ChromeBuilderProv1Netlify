import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get the session
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { projectId, title = 'New Conversation' } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    // Initialize Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Create Conversation API: Missing Supabase configuration');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify user owns the project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', session.user.id)
      .single();

    if (projectError || !project) {
      console.error('Create Conversation API: Project not found or not owned by user:', projectError);
      return res.status(404).json({ message: 'Project not found' });
    }

    // Create the conversation
    const { data: conversation, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        project_id: projectId,
        title,
        messages: [],
        metadata: {}
      })
      .select()
      .single();

    if (error) {
      console.error('Create Conversation API: Error creating conversation:', error);
      return res.status(500).json({ message: error.message });
    }

    return res.status(201).json(conversation);
  } catch (error) {
    console.error('Create Conversation API: Unexpected error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 