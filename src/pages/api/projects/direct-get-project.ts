import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Get Project API: Fetching project:', req.query.projectId);
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { projectId } = req.query;
  
  // Check if projectId exists and is a string
  if (!projectId || typeof projectId !== 'string') {
    console.log(`Get Project API: Missing or invalid projectId: ${JSON.stringify(req.query)}`);
    return res.status(400).json({ 
      message: 'Project ID is required',
      error: 'Missing or invalid project ID'
    });
  }
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projectId)) {
    console.log(`Get Project API: Invalid project ID format: ${projectId}`);
    return res.status(400).json({ 
      message: 'Invalid project ID format',
      error: 'The provided ID is not a valid UUID'
    });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // Fetch the project
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (error) {
      console.error(`Get Project API: Database error:`, error);
      
      // Special handling for "more than one row returned" error
      if (error.message?.includes('multiple') || error.message?.includes('no rows')) {
        console.log(`Get Project API: No unique project found for ID: ${projectId}`);
        return res.status(404).json({
          message: 'Project not found',
          error: 'No project exists with the provided ID'
        });
      }
      
      return res.status(500).json({ 
        message: 'Database error while fetching project',
        error: error.message
      });
    }
    
    if (!project) {
      console.log(`Get Project API: Project not found: ${projectId}`);
      return res.status(404).json({ 
        message: 'Project not found' 
      });
    }
    
    console.log(`Get Project API: Project found: ${project.name}`);
    
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
    
    // Combine all data
    const projectWithData = {
      ...project,
      files: filesResult.data || [],
      conversations: conversationsResult.data || []
    };
    
    console.log(`Get Project API: Successfully fetched project with all related data`);
    
    // Return the project data
    return res.status(200).json({
      project: projectWithData
    });
  } catch (error) {
    console.error(`Get Project API: Unexpected error:`, error);
    return res.status(500).json({ 
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 