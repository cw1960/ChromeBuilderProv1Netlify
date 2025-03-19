import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      message: 'Method not allowed',
      debug: {
        timestamp: new Date().toISOString(),
        endpoint: 'robust-create',
        method: req.method
      }
    });
  }

  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      console.error(`[robust-create] Unauthorized: No valid session found`);
      return res.status(401).json({ 
        message: 'Unauthorized',
        debug: {
          timestamp: new Date().toISOString(),
          endpoint: 'robust-create'
        }
      });
    }
    
    const userId = session.user.id;
    
    // Get projectId from request body or query
    const projectId = req.body.projectId || req.query.projectId;
    
    // Validate projectId
    if (!projectId || typeof projectId !== 'string') {
      console.error(`[robust-create] Missing or invalid projectId: ${projectId}`);
      return res.status(400).json({ 
        message: 'Missing or invalid projectId',
        debug: {
          timestamp: new Date().toISOString(),
          endpoint: 'robust-create',
          projectId
        }
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      console.error(`[robust-create] Invalid UUID format for projectId: ${projectId}`);
      return res.status(400).json({ 
        message: 'Invalid project ID format',
        debug: {
          timestamp: new Date().toISOString(),
          endpoint: 'robust-create',
          projectId
        }
      });
    }
    
    // Get title from request body or use default
    const title = req.body.title || 'New Conversation';
    
    console.log(`[robust-create] Creating conversation for project: ${projectId}`);
    
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    console.log(`[robust-create] Supabase client initialized`);
    
    // Check if project exists and belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();
    
    if (projectError) {
      console.error(`[robust-create] Error checking project:`, projectError);
      
      // Handle "not found" case specifically
      if (projectError.code === 'PGRST116') {
        return res.status(404).json({ 
          message: 'Project not found',
          debug: {
            timestamp: new Date().toISOString(),
            endpoint: 'robust-create',
            projectId,
            error: projectError.message,
            code: projectError.code
          }
        });
      }
      
      return res.status(500).json({ 
        message: 'Error checking project',
        debug: {
          timestamp: new Date().toISOString(),
          endpoint: 'robust-create',
          projectId,
          error: projectError.message,
          code: projectError.code
        }
      });
    }
    
    if (!project) {
      console.error(`[robust-create] Project not found: ${projectId}`);
      return res.status(404).json({ 
        message: 'Project not found',
        debug: {
          timestamp: new Date().toISOString(),
          endpoint: 'robust-create',
          projectId
        }
      });
    }
    
    // Verify project belongs to user
    if (project.user_id !== userId) {
      console.error(`[robust-create] Unauthorized: Project ${projectId} does not belong to user ${userId}`);
      return res.status(403).json({ 
        message: 'You do not have permission to create conversations for this project',
        debug: {
          timestamp: new Date().toISOString(),
          endpoint: 'robust-create',
          projectId,
          userId
        }
      });
    }
    
    console.log(`[robust-create] Project found and verified: ${projectId}`);
    
    // Create conversation
    const conversationId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        id: conversationId,
        project_id: projectId,
        user_id: userId,
        title,
        created_at: timestamp,
        updated_at: timestamp
      })
      .select()
      .single();
    
    if (conversationError) {
      console.error(`[robust-create] Error creating conversation:`, conversationError);
      return res.status(500).json({ 
        message: 'Error creating conversation',
        debug: {
          timestamp: new Date().toISOString(),
          endpoint: 'robust-create',
          projectId,
          error: conversationError.message,
          code: conversationError.code
        }
      });
    }
    
    console.log(`[robust-create] Conversation created successfully: ${conversationId}`);
    
    return res.status(201).json({
      message: 'Conversation created successfully',
      conversation,
      debug: {
        timestamp: new Date().toISOString(),
        endpoint: 'robust-create',
        projectId,
        conversationId
      }
    });
  } catch (error) {
    console.error(`[robust-create] Unexpected error:`, error);
    return res.status(500).json({
      message: 'Failed to create conversation',
      error: error instanceof Error ? error.message : String(error),
      debug: {
        timestamp: new Date().toISOString(),
        endpoint: 'robust-create'
      }
    });
  }
} 