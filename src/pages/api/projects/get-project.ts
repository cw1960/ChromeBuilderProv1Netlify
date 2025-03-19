import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { projectId } = req.query;

  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({ message: 'Project ID is required' });
  }

  try {
    // Initialize Supabase admin client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Get Project API: Missing Supabase configuration');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log(`Get Project API: Fetching project: ${projectId}`);
    
    // First, check if the project exists and how many records match the ID
    const { data: projectCheck, error: checkError } = await supabaseAdmin
      .from('projects')
      .select('id, name')
      .eq('id', projectId);
    
    if (checkError) {
      console.error('Get Project API: Error checking project:', checkError);
      return res.status(500).json({ 
        message: 'Error checking project',
        error: checkError
      });
    }
    
    if (!projectCheck || projectCheck.length === 0) {
      console.log(`Get Project API: Project not found: ${projectId}`);
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (projectCheck.length > 1) {
      console.error(`Get Project API: Multiple projects found with ID ${projectId}. Count: ${projectCheck.length}`);
      // Handle the case where multiple projects have the same ID
      // We'll use the first one for now
      console.log('Get Project API: Using the first project found');
    }
    
    // Query the database for the project, but don't use single() to avoid the error
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId);
    
    if (projectError) {
      console.error('Get Project API: Error fetching project:', projectError);
      return res.status(500).json({ 
        message: 'Error fetching project',
        error: projectError
      });
    }
    
    if (!projectData || projectData.length === 0) {
      console.log(`Get Project API: Project not found: ${projectId}`);
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Use the first project if multiple were found
    const project = projectData[0];
    console.log(`Get Project API: Project found: ${project.name}`);
    
    // Get project files
    const { data: files, error: filesError } = await supabaseAdmin
      .from('extension_files')
      .select('*')
      .eq('project_id', projectId);
    
    if (filesError) {
      console.error('Get Project API: Error fetching files:', filesError);
      // Continue anyway, we'll just return an empty array
    }
    
    // Get project settings
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('project_settings')
      .select('*')
      .eq('project_id', projectId);
    
    if (settingsError) {
      console.error('Get Project API: Error fetching settings:', settingsError);
      // Continue anyway, we'll just return an empty object
    }
    
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
    
    if (deploymentError) {
      console.error('Get Project API: Error fetching deployment history:', deploymentError);
      // Continue anyway, we'll just return an empty array
    }
    
    // Get conversations
    const { data: conversationsData, error: conversationsError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false });
    
    let finalConversations = conversationsData;
    if (conversationsError) {
      // If the error is about a missing table or column, just treat it as no conversations
      if (conversationsError.code === '42P01' || conversationsError.code === '42703') {
        console.log('Get Project API: Conversations table or column not found, treating as empty');
        finalConversations = [];
      } else {
        console.error('Get Project API: Error fetching conversations:', conversationsError);
        finalConversations = [];
      }
    }
    
    // Return the project with all related data
    const projectWithData = {
      ...project,
      files: files || [],
      settings: settings,
      deployment_history: deploymentHistory || [],
      conversation_history: finalConversations || []
    };
    
    console.log('Get Project API: Successfully fetched project with all related data');
    
    return res.status(200).json({
      message: 'Project retrieved successfully',
      project: projectWithData
    });
  } catch (error) {
    console.error('Get Project API: Unexpected error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 