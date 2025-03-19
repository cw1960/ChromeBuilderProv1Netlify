import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  try {
    // Parse URL and query parameters
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    const userId = url.searchParams.get('userId');
    
    // Initialize Supabase admin client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          message: 'Server configuration error',
          error: 'Missing Supabase configuration'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Check database connection
    const { data: connectionTest, error: connectionError } = await supabaseAdmin
      .from('projects')
      .select('count(*)');
    
    if (connectionError) {
      return new Response(
        JSON.stringify({ 
          message: 'Database connection error',
          error: connectionError
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // If projectId is provided, try to fetch that specific project
    let projectData = null;
    let projectError = null;
    
    if (projectId) {
      // First try without .single() to avoid the error
      const { data: projects, error } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('id', projectId);
      
      if (error) {
        projectError = error;
      } else if (projects && projects.length > 0) {
        projectData = projects[0]; // Use the first project if multiple were found
      }
    }
    
    // If userId is provided, fetch all projects for that user
    let userProjects = null;
    let userProjectsError = null;
    
    if (userId) {
      const { data: projects, error } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        userProjectsError = error;
      } else {
        userProjects = projects;
      }
    }
    
    // Return all the collected information
    return new Response(
      JSON.stringify({
        message: 'Edge database check completed',
        connection: {
          status: 'connected',
          data: connectionTest
        },
        project: projectId ? {
          id: projectId,
          data: projectData,
          error: projectError,
          found: !!projectData
        } : null,
        userProjects: userId ? {
          userId,
          data: userProjects,
          error: userProjectsError,
          count: userProjects?.length || 0
        } : null
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 