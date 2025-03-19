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
    
    if (!projectId) {
      return new Response(
        JSON.stringify({ message: 'Project ID is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
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
    
    // First, check if the project exists and how many records match the ID
    const { data: projectCheck, error: checkError } = await supabaseAdmin
      .from('projects')
      .select('id, name')
      .eq('id', projectId);
    
    if (checkError) {
      return new Response(
        JSON.stringify({ 
          message: 'Error checking project',
          error: checkError
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (!projectCheck || projectCheck.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Project not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Query the database for the project, but don't use single() to avoid the error
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId);
    
    if (projectError) {
      return new Response(
        JSON.stringify({ 
          message: 'Error fetching project',
          error: projectError
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (!projectData || projectData.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Project not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Use the first project if multiple were found
    const project = projectData[0];
    
    // Get project files
    const { data: files, error: filesError } = await supabaseAdmin
      .from('extension_files')
      .select('*')
      .eq('project_id', projectId);
    
    // Get project settings
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('project_settings')
      .select('*')
      .eq('project_id', projectId);
    
    // Process settings into a more usable format
    const settings = project.settings || {};
    if (settingsData && settingsData.length > 0) {
      settingsData.forEach((setting) => {
        settings[setting.key] = setting.value;
      });
    }
    
    // Get deployment history
    const { data: deploymentHistory, error: deploymentError } = await supabaseAdmin
      .from('deployment_history')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    // Get conversations
    const { data: conversationsData, error: conversationsError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false });
    
    // Return the project with all related data
    const projectWithData = {
      ...project,
      files: files || [],
      settings: settings,
      deployment_history: deploymentHistory || [],
      conversation_history: conversationsData || []
    };
    
    return new Response(
      JSON.stringify({
        message: 'Project retrieved successfully',
        project: projectWithData
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