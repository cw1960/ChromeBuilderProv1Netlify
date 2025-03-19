import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Initialize Supabase admin client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('DB Check API: Missing Supabase configuration');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Get project ID from query parameter
    const projectId = req.query.projectId as string;
    const userId = req.query.userId as string;
    
    // Check database connection
    console.log('DB Check API: Testing database connection');
    const { data: connectionTest, error: connectionError } = await supabaseAdmin.from('projects').select('count(*)');
    
    if (connectionError) {
      console.error('DB Check API: Database connection error:', connectionError);
      return res.status(500).json({ 
        message: 'Database connection error',
        error: connectionError
      });
    }
    
    // If projectId is provided, try to fetch that specific project
    let projectData = null;
    let projectError = null;
    
    if (projectId) {
      console.log(`DB Check API: Fetching project with ID: ${projectId}`);
      
      // First try with .single()
      const { data: singleProject, error: singleError } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (singleError) {
        console.error('DB Check API: Error fetching project with single():', singleError);
        
        // If single() fails, try without it to see if we get multiple results
        const { data: multipleProjects, error: multipleError } = await supabaseAdmin
          .from('projects')
          .select('*')
          .eq('id', projectId);
        
        if (multipleError) {
          console.error('DB Check API: Error fetching project without single():', multipleError);
          projectError = multipleError;
        } else {
          console.log(`DB Check API: Found ${multipleProjects?.length || 0} projects with ID ${projectId}`);
          projectData = multipleProjects;
        }
      } else {
        projectData = singleProject;
      }
    }
    
    // If userId is provided, fetch all projects for that user
    let userProjects = null;
    let userProjectsError = null;
    
    if (userId) {
      console.log(`DB Check API: Fetching projects for user: ${userId}`);
      const { data: projects, error } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('DB Check API: Error fetching user projects:', error);
        userProjectsError = error;
      } else {
        console.log(`DB Check API: Found ${projects?.length || 0} projects for user ${userId}`);
        userProjects = projects;
      }
    }
    
    // Return all the collected information
    return res.status(200).json({
      message: 'Database check completed',
      connection: {
        status: 'connected',
        data: connectionTest
      },
      project: projectId ? {
        id: projectId,
        data: projectData,
        error: projectError,
        count: Array.isArray(projectData) ? projectData.length : (projectData ? 1 : 0)
      } : null,
      userProjects: userId ? {
        userId,
        data: userProjects,
        error: userProjectsError,
        count: userProjects?.length || 0
      } : null
    });
  } catch (error) {
    console.error('DB Check API: Unexpected error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 