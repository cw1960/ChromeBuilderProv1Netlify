import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the session
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user?.id) {
      console.error('Direct Delete API: No authenticated session found');
      return res.status(401).json({ message: 'No active session. Please sign in again.' });
    }
    
    const userId = session.user.id;
    console.log('Direct Delete API: Using authenticated user ID:', userId);
    
    // Get project ID from query parameter
    const projectId = req.query.projectId as string;
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }
    
    // Initialize Supabase admin client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Direct Delete API: Missing Supabase configuration');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log(`Direct Delete API: Deleting project ${projectId} for user ${userId}`);
    
    // First verify that the project belongs to the user
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single();
    
    if (projectError) {
      console.error('Direct Delete API: Error fetching project:', projectError);
      return res.status(404).json({ 
        message: 'Project not found',
        error: projectError.message
      });
    }
    
    if (!projectData) {
      console.error('Direct Delete API: Project not found');
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (projectData.user_id !== userId) {
      console.error('Direct Delete API: Project does not belong to user');
      return res.status(403).json({ message: 'You do not have permission to delete this project' });
    }
    
    // Delete project files first (foreign key constraint)
    const { error: filesError } = await supabaseAdmin
      .from('extension_files')
      .delete()
      .eq('project_id', projectId);
    
    if (filesError) {
      console.error('Direct Delete API: Error deleting project files:', filesError);
      return res.status(500).json({ 
        message: 'Error deleting project files',
        error: filesError.message
      });
    }
    
    // Delete conversation entries
    const { error: conversationsError } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('project_id', projectId);
    
    if (conversationsError) {
      console.error('Direct Delete API: Error deleting conversations:', conversationsError);
      // Continue anyway, this is not critical
    }
    
    // Delete project settings
    const { error: settingsError } = await supabaseAdmin
      .from('project_settings')
      .delete()
      .eq('project_id', projectId);
    
    if (settingsError) {
      console.error('Direct Delete API: Error deleting project settings:', settingsError);
      // Continue anyway, this is not critical
    }
    
    // Delete deployment history
    const { error: deploymentError } = await supabaseAdmin
      .from('deployment_history')
      .delete()
      .eq('project_id', projectId);
    
    if (deploymentError) {
      console.error('Direct Delete API: Error deleting deployment history:', deploymentError);
      // Continue anyway, this is not critical
    }
    
    // Finally delete the project itself
    const { error: deleteError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    if (deleteError) {
      console.error('Direct Delete API: Error deleting project:', deleteError);
      return res.status(500).json({ 
        message: 'Error deleting project',
        error: deleteError.message
      });
    }
    
    console.log('Direct Delete API: Project deleted successfully');
    
    return res.status(200).json({ 
      message: 'Project deleted successfully',
      projectId
    });
  } catch (error) {
    console.error('Direct Delete API: Unexpected error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 