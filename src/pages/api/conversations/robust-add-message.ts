import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      message: 'Method not allowed',
      debug: {
        timestamp: new Date().toISOString(),
        endpoint: 'robust-add-message',
        method: req.method
      }
    });
  }

  // Get conversationId, content, and role from request body
  const { conversationId, content, role = 'user' } = req.body;
  
  // Validate conversationId
  if (!conversationId || typeof conversationId !== 'string') {
    console.error(`[robust-add-message] Missing or invalid conversationId: ${conversationId}`);
    return res.status(400).json({ 
      message: 'Missing or invalid conversationId',
      debug: {
        timestamp: new Date().toISOString(),
        endpoint: 'robust-add-message',
        conversationId
      }
    });
  }

  // Validate content
  if (!content || typeof content !== 'string') {
    console.error(`[robust-add-message] Missing or invalid content for conversation: ${conversationId}`);
    return res.status(400).json({ 
      message: 'Message content is required and must be a string',
      debug: {
        timestamp: new Date().toISOString(),
        endpoint: 'robust-add-message',
        conversationId
      }
    });
  }

  // Validate role
  if (role !== 'user' && role !== 'assistant' && role !== 'system') {
    console.error(`[robust-add-message] Invalid role: ${role} for conversation: ${conversationId}`);
    return res.status(400).json({ 
      message: 'Role must be one of: user, assistant, system',
      debug: {
        timestamp: new Date().toISOString(),
        endpoint: 'robust-add-message',
        conversationId,
        role
      }
    });
  }

  try {
    console.log(`[robust-add-message] Adding message to conversation: ${conversationId}`);
    
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    console.log(`[robust-add-message] Supabase client initialized`);
    
    // Check if conversation exists
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, project_id')
      .eq('id', conversationId)
      .single();
    
    if (conversationError) {
      console.error(`[robust-add-message] Error checking conversation:`, conversationError);
      
      // Handle "not found" case specifically
      if (conversationError.code === 'PGRST116') {
        return res.status(404).json({ 
          message: 'Conversation not found',
          debug: {
            timestamp: new Date().toISOString(),
            endpoint: 'robust-add-message',
            conversationId,
            error: conversationError.message,
            code: conversationError.code
          }
        });
      }
      
      return res.status(500).json({ 
        message: 'Error checking conversation',
        debug: {
          timestamp: new Date().toISOString(),
          endpoint: 'robust-add-message',
          conversationId,
          error: conversationError.message,
          code: conversationError.code
        }
      });
    }
    
    if (!conversation) {
      console.error(`[robust-add-message] Conversation not found: ${conversationId}`);
      return res.status(404).json({ 
        message: 'Conversation not found',
        debug: {
          timestamp: new Date().toISOString(),
          endpoint: 'robust-add-message',
          conversationId
        }
      });
    }
    
    console.log(`[robust-add-message] Conversation found: ${conversationId}`);
    
    // Create message
    const messageId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        id: messageId,
        conversation_id: conversationId,
        role,
        content,
        created_at: timestamp,
        updated_at: timestamp
      })
      .select()
      .single();
    
    if (messageError) {
      console.error(`[robust-add-message] Error creating message:`, messageError);
      return res.status(500).json({ 
        message: 'Error creating message',
        debug: {
          timestamp: new Date().toISOString(),
          endpoint: 'robust-add-message',
          conversationId,
          error: messageError.message,
          code: messageError.code
        }
      });
    }
    
    // Update conversation's updated_at timestamp
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ updated_at: timestamp })
      .eq('id', conversationId);
    
    if (updateError) {
      console.error(`[robust-add-message] Error updating conversation timestamp:`, updateError);
      // Continue anyway since the message was created successfully
    }
    
    console.log(`[robust-add-message] Message added successfully to conversation: ${conversationId}`);
    
    return res.status(201).json({
      message: 'Message added successfully',
      messageId,
      messageData: message,
      debug: {
        timestamp: new Date().toISOString(),
        endpoint: 'robust-add-message',
        conversationId
      }
    });
  } catch (error) {
    console.error(`[robust-add-message] Unexpected error:`, error);
    return res.status(500).json({
      message: 'Failed to add message to conversation',
      error: error instanceof Error ? error.message : String(error),
      debug: {
        timestamp: new Date().toISOString(),
        endpoint: 'robust-add-message',
        conversationId
      }
    });
  }
} 