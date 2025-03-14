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
      console.error('Missing Supabase configuration');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log(`Verify API: Checking if project exists: ${projectId}`);
    
    // Query the database for the project
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('id, name, description, created_at')
      .eq('id', projectId)
      .single();
    
    if (error) {
      console.error('Verify API: Error querying project:', error);
      return res.status(500).json({ 
        message: 'Error querying database',
        error: error.message
      });
    }
    
    if (!project) {
      console.log(`Verify API: Project not found: ${projectId}`);
      return res.status(404).json({ message: 'Project not found' });
    }
    
    console.log(`Verify API: Project found: ${project.name}`);
    
    // Return success with basic project info
    return res.status(200).json({
      message: 'Project exists',
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        created_at: project.created_at
      }
    });
  } catch (error) {
    console.error('Verify API: Unexpected error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 