import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the session
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const userId = session.user.id;
    
    // Get the project ID from the request body or query
    const projectId = req.body.projectId || req.query.projectId;
    
    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ message: 'Project ID is required' });
    }
    
    console.log(`DIRECT Create Conversation API: Creating conversation for project: ${projectId}`);
    
    // Create a direct Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    
    // Generate a conversation ID
    const conversationId = uuidv4();
    console.log(`Generated conversation ID: ${conversationId}`);
    
    // Create the conversation object
    const conversation = {
      id: conversationId,
      project_id: projectId,
      title: 'New Conversation',
      messages: [],
      metadata: {},
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log(`Creating conversation with data:`, conversation);
    
    // Insert the conversation into the database
    const { data, error } = await supabase
      .from('conversations')
      .insert(conversation)
      .select()
      .single();
    
    if (error) {
      console.error('DIRECT Create Conversation API: Error creating conversation:', error);
      return res.status(500).json({ 
        message: 'Error creating conversation',
        error: error.message
      });
    }
    
    if (!data) {
      console.error('DIRECT Create Conversation API: No data returned after creating conversation');
      return res.status(500).json({ message: 'Failed to create conversation' });
    }
    
    console.log(`DIRECT Create Conversation API: Conversation created successfully: ${data.id}`);
    
    return res.status(201).json({
      message: 'Conversation created successfully',
      conversation: data
    });
  } catch (error) {
    console.error('DIRECT Create Conversation API: Unexpected error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 