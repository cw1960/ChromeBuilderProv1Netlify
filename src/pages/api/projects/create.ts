import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getToken } from 'next-auth/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the authentication token from the request
    const token = await getToken({ req });
    
    if (!token) {
      console.error('No authentication token found');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    console.log('API: Authenticated user ID:', token.sub);
    
    // Extract project data from the request body
    const { 
      projectId, 
      name, 
      description, 
      userId, 
      manifest, 
      files 
    } = req.body;
    
    // Validate required fields
    if (!projectId || !name || !userId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Verify that the authenticated user matches the requested user ID
    if (token.sub !== userId) {
      console.error(`User ID mismatch: token.sub=${token.sub}, userId=${userId}`);
      return res.status(403).json({ message: 'Forbidden: User ID mismatch' });
    }
    
    // Initialize Supabase admin client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const now = new Date().toISOString();
    
    // Save the project to the database
    console.log('API: Saving project to database');
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        id: projectId,
        name,
        description,
        version: '1.0.0',
        manifest,
        user_id: userId,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
    
    if (projectError) {
      console.error('API: Error saving project to database:', projectError);
      return res.status(500).json({ 
        message: `Failed to save project: ${projectError.message}`,
        error: projectError
      });
    }
    
    console.log('API: Project saved to database:', projectData?.id);
    
    // Save the files to the database
    console.log('API: Saving files to database');
    for (const file of files) {
      const { error: fileError } = await supabaseAdmin
        .from('files')
        .insert({
          id: file.id,
          project_id: projectId,
          name: file.name,
          path: file.path,
          content: file.content,
          type: file.type,
          created_at: file.created_at,
          updated_at: file.updated_at
        });
      
      if (fileError) {
        console.error(`API: Error saving file ${file.name} to database:`, fileError);
        // Continue with other files even if one fails
      }
    }
    
    // Create default project settings
    console.log('API: Creating project settings');
    const { error: settingsError } = await supabaseAdmin
      .from('project_settings')
      .insert({
        project_id: projectId,
        settings: JSON.stringify({
          theme: 'light',
          editor_font_size: 14,
          auto_save: true,
        }),
      });
    
    if (settingsError) {
      console.error('API: Error saving project settings:', settingsError);
      // Continue even if settings fail
    }
    
    // Create an initial conversation
    console.log('API: Creating initial conversation');
    const { error: conversationError } = await supabaseAdmin
      .from('conversations')
      .insert({
        project_id: projectId,
        title: 'Initial Conversation',
        created_at: now,
        updated_at: now
      });
    
    if (conversationError) {
      console.error('API: Error creating initial conversation:', conversationError);
      // Continue even if conversation creation fails
    }
    
    // Return success response
    return res.status(200).json({
      message: 'Project created successfully',
      project: {
        id: projectId,
        name,
        description
      }
    });
  } catch (error) {
    console.error('API: Unexpected error in project creation:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 