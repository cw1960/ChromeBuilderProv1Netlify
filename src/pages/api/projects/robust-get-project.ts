import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { projectId } = req.query;

  if (!projectId || typeof projectId !== 'string') {
    console.log(`[robust-get-project] Missing or invalid projectId: ${JSON.stringify(req.query)}`);
    return res.status(400).json({ 
      message: 'Project ID is required and must be a string',
      _debug: {
        timestamp: new Date().toISOString(),
        endpoint: 'robust-get-project',
        query: req.query
      }
    });
  }

  try {
    console.log(`[robust-get-project] Fetching project with ID: ${projectId}`);
    
    // Validate UUID format before querying
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      console.log(`[robust-get-project] Invalid project ID format: ${projectId}`);
      return res.status(400).json({ 
        message: 'Invalid project ID format',
        error: 'The provided ID is not a valid UUID',
        _debug: {
          timestamp: new Date().toISOString(),
          endpoint: 'robust-get-project',
          providedId: projectId
        }
      });
    }
    
    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    console.log(`[robust-get-project] Supabase client initialized, URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 10)}...`);

    // Fetch the project
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (error) {
      // Handle database errors
      console.error(`[robust-get-project] Database error:`, error);
      
      return res.status(500).json({ 
        message: 'Database error while fetching project',
        error: error.message,
        _debug: {
          timestamp: new Date().toISOString(),
          endpoint: 'robust-get-project',
          projectId,
          errorCode: error.code
        }
      });
    }

    if (!project) {
      console.log(`[robust-get-project] Project not found: ${projectId}`);
      return res.status(404).json({ 
        message: 'Project not found',
        _debug: {
          timestamp: new Date().toISOString(),
          endpoint: 'robust-get-project',
          projectId
        }
      });
    }

    console.log(`[robust-get-project] Project found: ${project.name}, fetching related data...`);

    // Fetch related data
    const [filesResult, conversationsResult] = await Promise.all([
      // Get project files
      supabase
        .from('extension_files')
        .select('*')
        .eq('project_id', projectId),
      
      // Get conversations
      supabase
        .from('conversations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
    ]);

    if (filesResult.error) {
      console.error(`[robust-get-project] Error fetching files:`, filesResult.error);
    } else {
      console.log(`[robust-get-project] Found ${filesResult.data?.length || 0} files for project ${projectId}`);
    }

    if (conversationsResult.error) {
      console.error(`[robust-get-project] Error fetching conversations:`, conversationsResult.error);
    } else {
      console.log(`[robust-get-project] Found ${conversationsResult.data?.length || 0} conversations for project ${projectId}`);
    }

    // Combine all data
    const projectWithData = {
      ...project,
      files: filesResult.data || [],
      conversations: conversationsResult.data || []
    };

    console.log(`[robust-get-project] Successfully fetched project: ${project.name}`);
    
    // Return the project data
    return res.status(200).json({
      message: 'Project fetched successfully',
      project: projectWithData,
      _debug: {
        timestamp: new Date().toISOString(),
        endpoint: 'robust-get-project',
        projectId,
        projectFound: true,
        filesCount: filesResult.data?.length || 0,
        conversationsCount: conversationsResult.data?.length || 0
      }
    });
  } catch (error) {
    console.error(`[robust-get-project] Unexpected error:`, error);
    return res.status(500).json({ 
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : String(error),
      _debug: {
        timestamp: new Date().toISOString(),
        endpoint: 'robust-get-project',
        projectId
      }
    });
  }
} 