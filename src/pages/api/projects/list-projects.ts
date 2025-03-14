import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('API - list-projects: Request received');
    
    // Get user ID from query parameter or session
    let userId = req.query.userId as string;
    
    // If no userId provided, try to get it from the session
    if (!userId) {
      const session = await getServerSession(req, res, authOptions);
      console.log('API - list-projects: Session:', session);
      
      if (!session?.user?.id) {
        return res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'No user ID provided and no authenticated session found',
          session: session || null
        });
      }
      
      userId = session.user.id;
    }
    
    console.log(`API - list-projects: Fetching projects for user ${userId}`);
    
    // Try to fetch projects with the authenticated client first
    let { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    // If that fails, try with the admin client
    if (error && supabaseAdmin) {
      console.log('API - list-projects: Error with authenticated client, trying admin client:', error);
      
      const { data: adminProjects, error: adminError } = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (adminError) {
        console.error('API - list-projects: Admin client error:', adminError);
        return res.status(500).json({ 
          error: 'Database error', 
          message: adminError.message,
          details: adminError
        });
      }
      
      projects = adminProjects;
    } else if (error) {
      console.error('API - list-projects: Database error and no admin client available:', error);
      return res.status(500).json({ 
        error: 'Database error', 
        message: error.message,
        details: error
      });
    }
    
    // Check if we found any projects
    if (!projects || projects.length === 0) {
      console.log(`API - list-projects: No projects found for user ${userId}`);
      
      // Do a raw query to check if there are ANY projects in the database
      const { data: allProjects, error: allProjectsError } = await (supabaseAdmin || supabase)
        .from('projects')
        .select('id, user_id, name')
        .limit(10);
      
      return res.status(200).json({ 
        projects: [], 
        message: 'No projects found',
        debug: {
          userId,
          projectsCount: 0,
          allProjectsCount: allProjects?.length || 0,
          allProjects: allProjects || [],
          allProjectsError: allProjectsError || null
        }
      });
    }
    
    console.log(`API - list-projects: Found ${projects.length} projects for user ${userId}`);
    
    return res.status(200).json({ 
      projects, 
      count: projects.length,
      message: `Found ${projects.length} projects`
    });
  } catch (error) {
    console.error('API - list-projects: Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 