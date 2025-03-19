import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Define types
interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  title?: string;
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;

  // Handle GET request - List conversations for a project
  if (req.method === 'GET') {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    try {
      // Verify project ownership
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

      if (projectError || !project) {
        console.error('Error verifying project ownership:', projectError);
        return res.status(403).json({ error: 'Not authorized to access this project' });
      }

      // Get conversations for the project
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('id, created_at, updated_at')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });

      if (error) {
        // If the error is about a missing column, return an empty array
        if (error.code === '42703') {
          return res.status(200).json([]);
        }
        console.error('Error fetching conversations:', error);
        return res.status(500).json({ error: 'Failed to fetch conversations' });
      }

      // Map conversations to include a default title if none exists
      const conversationsWithTitles = (conversations as Conversation[] || []).map(conv => ({
        ...conv,
        title: conv.title || 'Untitled Conversation'
      }));

      return res.status(200).json(conversationsWithTitles);
    } catch (error) {
      console.error('Error in conversations API:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Handle POST request - Create a new conversation
  if (req.method === 'POST') {
    const { projectId, title } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    try {
      // Verify project ownership
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

      if (projectError || !project) {
        console.error('Error verifying project ownership:', projectError);
        return res.status(403).json({ error: 'Not authorized to access this project' });
      }

      // Create a new conversation
      const conversationId = uuidv4();
      console.log('Generated conversation ID:', conversationId);

      // Create a conversation object with all required fields
      const conversationData = {
        id: conversationId,
        project_id: projectId,
        title: title || 'New Conversation',
        user_id: userId,
        messages: [],
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Creating conversation with data:', conversationData);

      const { error } = await supabase
        .from('conversations')
        .insert(conversationData);

      if (error) {
        console.error('Error creating conversation:', error);
        return res.status(500).json({ error: 'Failed to create conversation' });
      }

      return res.status(201).json(conversationData);
    } catch (error) {
      console.error('Error in conversations API:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
} 