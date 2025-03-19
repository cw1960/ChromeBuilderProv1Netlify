import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get the conversation ID from the path or query
  const conversationId = req.query.conversationId || req.query.id;

  if (!conversationId || typeof conversationId !== 'string') {
    return res.status(400).json({ message: 'Conversation ID is required' });
  }

  try {
    console.log(`DIRECT Get Conversation API: Fetching conversation: ${conversationId}`);
    
    // Create a direct Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    
    // Query the database for the conversation
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`DIRECT Get Conversation API: Conversation not found: ${conversationId}`);
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      console.error('DIRECT Get Conversation API: Error fetching conversation:', error);
      return res.status(500).json({ 
        message: 'Error fetching conversation',
        error: error.message
      });
    }
    
    if (!data) {
      console.log(`DIRECT Get Conversation API: Conversation not found: ${conversationId}`);
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    console.log(`DIRECT Get Conversation API: Conversation found: ${conversationId}`);
    
    return res.status(200).json({
      message: 'Conversation retrieved successfully',
      conversation: data
    });
  } catch (error) {
    console.error('DIRECT Get Conversation API: Unexpected error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 