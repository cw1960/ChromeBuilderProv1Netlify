import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, session);
    case 'POST':
      return handlePost(req, res, session);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get conversations for a project
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any
) {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', session.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get conversations
    const { data: conversations, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return res.status(500).json({ message: error.message });
    }

    return res.status(200).json(conversations);
  } catch (error: any) {
    console.error('Error in conversations GET:', error);
    return res.status(500).json({ message: error.message });
  }
}

// Create a new conversation
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any
) {
  try {
    const { projectId, title, messages, metadata } = req.body;

    if (!projectId || !title) {
      return res.status(400).json({ message: 'Project ID and title are required' });
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', session.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Create conversation
    const { data: conversation, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        project_id: projectId,
        title,
        messages: messages || [],
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return res.status(500).json({ message: error.message });
    }

    return res.status(201).json(conversation);
  } catch (error: any) {
    console.error('Error in conversations POST:', error);
    return res.status(500).json({ message: error.message });
  }
} 