import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Initialize Supabase admin client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Direct Query API: Missing Supabase configuration');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Get user ID from query parameter
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    console.log(`Direct Query API: Querying projects for user ${userId}`);
    
    // Query the database for the user's projects
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Direct Query API: Database error:', error);
      return res.status(500).json({ 
        message: 'Error fetching projects',
        error: error.message
      });
    }
    
    console.log(`Direct Query API: Found ${projects?.length || 0} projects`);
    
    return res.status(200).json({ 
      message: 'Projects retrieved successfully',
      projects: projects || [],
      count: projects?.length || 0
    });
  } catch (error) {
    console.error('Direct Query API: Unexpected error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 