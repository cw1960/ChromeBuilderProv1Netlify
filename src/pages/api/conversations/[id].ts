import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { createClient } from '@supabase/supabase-js';

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
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Conversation ID is required' });
  }

  // Handle GET request - Get a specific conversation
  if (req.method === 'GET') {
    try {
      // Get the conversation and verify ownership
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching conversation:', error);
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Get conversation entries
      const { data: entries, error: entriesError } = await supabase
        .from('conversation_entries')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (entriesError) {
        console.error('Error fetching conversation entries:', entriesError);
        return res.status(500).json({ error: 'Failed to fetch conversation entries' });
      }

      return res.status(200).json({
        ...conversation,
        entries: entries || []
      });
    } catch (error) {
      console.error('Error in conversation GET:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Handle PATCH request - Update a conversation
  if (req.method === 'PATCH') {
    const { title } = req.body;

    try {
      // Verify conversation ownership
      const { data: conversation, error: verifyError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (verifyError || !conversation) {
        console.error('Error verifying conversation ownership:', verifyError);
        return res.status(403).json({ error: 'Not authorized to update this conversation' });
      }

      // Update the conversation
      const updates: any = {
        updated_at: new Date().toISOString()
      };

      if (title !== undefined) {
        updates.title = title;
      }

      const { error } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating conversation:', error);
        return res.status(500).json({ error: 'Failed to update conversation' });
      }

      return res.status(200).json({ id, ...updates });
    } catch (error) {
      console.error('Error in conversation PATCH:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Handle DELETE request - Delete a conversation
  if (req.method === 'DELETE') {
    try {
      // Verify conversation ownership
      const { data: conversation, error: verifyError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (verifyError || !conversation) {
        console.error('Error verifying conversation ownership:', verifyError);
        return res.status(403).json({ error: 'Not authorized to delete this conversation' });
      }

      // Delete conversation entries first
      const { error: entriesError } = await supabase
        .from('conversation_entries')
        .delete()
        .eq('conversation_id', id);

      if (entriesError) {
        console.error('Error deleting conversation entries:', entriesError);
        return res.status(500).json({ error: 'Failed to delete conversation entries' });
      }

      // Delete the conversation
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting conversation:', error);
        return res.status(500).json({ error: 'Failed to delete conversation' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in conversation DELETE:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
} 