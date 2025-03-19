import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log(`[system-check] Running system check`);
    
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    console.log(`[system-check] Supabase client initialized`);
    
    // Check database connection by querying projects count
    const { count: projectsCount, error: projectsError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });
    
    if (projectsError) {
      console.error(`[system-check] Error checking projects:`, projectsError);
      return res.status(500).json({
        message: 'System check failed',
        status: {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
          database: { 
            status: 'Error', 
            error: projectsError.message,
            code: projectsError.code
          }
        }
      });
    }
    
    // Check conversations count
    const { count: conversationsCount, error: conversationsError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });
    
    if (conversationsError) {
      console.error(`[system-check] Error checking conversations:`, conversationsError);
    }
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const heapUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    
    console.log(`[system-check] System check completed successfully`);
    
    // Return system status
    return res.status(200).json({
      message: 'System status check completed',
      status: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: { 
          status: 'Connected', 
          projectsCount: projectsCount || 0, 
          conversationsCount: conversationsCount || 0 
        },
        memory: { heapUsed, heapTotal },
        uptime: Math.floor(process.uptime())
      }
    });
  } catch (error) {
    console.error(`[system-check] Unexpected error:`, error);
    return res.status(500).json({
      message: 'System check failed',
      error: error instanceof Error ? error.message : String(error),
      status: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        database: { status: 'Unknown' }
      }
    });
  }
} 