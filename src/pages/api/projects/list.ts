import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getToken } from 'next-auth/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Projects List API: Getting all projects');
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // Fetch all projects for testing purposes
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error(`Projects List API: Database error:`, error);
      return res.status(500).json({ 
        message: 'Database error while fetching projects',
        error: error.message
      });
    }
    
    console.log(`Projects List API: Found ${projects?.length || 0} projects`);
    
    // Return the projects
    return res.status(200).json({
      message: 'Projects fetched successfully',
      projects: projects || []
    });
  } catch (error) {
    console.error(`Projects List API: Unexpected error:`, error);
    return res.status(500).json({ 
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 