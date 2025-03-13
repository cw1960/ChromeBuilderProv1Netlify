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
    case 'PUT':
      return handlePut(req, res, session);
    case 'DELETE':
      return handleDelete(req, res, session);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get a single conversation
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any
) {
  try {
    const { id } = req.query;

    // Get conversation and verify ownership through project
    const { data: conversation, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        projects:project_id (
          user_id
        )
      `)
      .eq('id', id)
      .single();

    if (error || !conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Verify user owns the project
    if (conversation.projects.user_id !== session.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.status(200).json(conversation);
  } catch (error: any) {
    console.error('Error in conversation GET:', error);
    return res.status(500).json({ message: error.message });
  }
}

// Update a conversation
async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any
) {
  try {
    const { id } = req.query;
    const { title, messages, metadata } = req.body;

    // Get conversation and verify ownership through project
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        projects:project_id (
          user_id
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Verify user owns the project
    if (existing.projects.user_id !== session.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Update conversation
    const { data: conversation, error } = await supabaseAdmin
      .from('conversations')
      .update({
        title: title || existing.title,
        messages: messages || existing.messages,
        metadata: metadata || existing.metadata
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating conversation:', error);
      return res.status(500).json({ message: error.message });
    }

    return res.status(200).json(conversation);
  } catch (error: any) {
    console.error('Error in conversation PUT:', error);
    return res.status(500).json({ message: error.message });
  }
}

// Delete a conversation
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any
) {
  try {
    const { id } = req.query;

    // Get conversation and verify ownership through project
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        projects:project_id (
          user_id
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Verify user owns the project
    if (existing.projects.user_id !== session.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Delete conversation
    const { error } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting conversation:', error);
      return res.status(500).json({ message: error.message });
    }

    return res.status(204).end();
  } catch (error: any) {
    console.error('Error in conversation DELETE:', error);
    return res.status(500).json({ message: error.message });
  }
} 