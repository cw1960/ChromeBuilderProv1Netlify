import { NextApiRequest, NextApiResponse } from 'next';
import { ProjectManager } from '@/lib/project-manager';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const statusReport = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'Missing',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configured' : 'Missing',
      },
      database: {
        status: 'Unknown',
        connectionTest: null,
        tablesAccessible: false,
        projectsCount: 0,
        conversationsCount: 0,
      },
      projectManager: {
        initialized: false,
      },
      memory: {
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
    };

    // Test database connection
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      // Test connection with a simple query
      const { data: connectionTest, error: connectionError } = await supabase
        .from('projects')
        .select('count()', { count: 'exact' })
        .limit(1);

      if (connectionError) {
        statusReport.database.status = 'Error';
        statusReport.database.connectionTest = connectionError.message;
      } else {
        statusReport.database.status = 'Connected';
        statusReport.database.tablesAccessible = true;
        
        // Get counts
        const { count: projectsCount } = await supabase
          .from('projects')
          .select('count()', { count: 'exact' });
          
        const { count: conversationsCount } = await supabase
          .from('conversations')
          .select('count()', { count: 'exact' });
          
        statusReport.database.projectsCount = projectsCount || 0;
        statusReport.database.conversationsCount = conversationsCount || 0;
      }
    } catch (dbError) {
      statusReport.database.status = 'Error';
      statusReport.database.connectionTest = dbError instanceof Error ? dbError.message : String(dbError);
    }

    // Test ProjectManager
    try {
      const projectManager = new ProjectManager();
      statusReport.projectManager.initialized = true;
    } catch (pmError) {
      statusReport.projectManager.initialized = false;
    }

    return res.status(200).json({
      message: 'System status report generated',
      status: statusReport
    });
  } catch (error) {
    console.error('Error generating system status report:', error);
    return res.status(500).json({ 
      message: 'An error occurred while generating system status report',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 