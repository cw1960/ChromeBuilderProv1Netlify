import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get table name from query parameter
    const table = req.query.table as string;
    if (!table) {
      return res.status(400).json({ 
        error: 'Bad request', 
        message: 'Table name is required'
      });
    }
    
    console.log(`API - debug/database: Querying table ${table}`);
    
    // Try with admin client first
    let adminData = null;
    let adminError = null;
    
    if (supabaseAdmin) {
      const result = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(100);
      
      adminData = result.data;
      adminError = result.error;
    }
    
    // Also try with regular client
    const { data: regularData, error: regularError } = await supabase
      .from(table)
      .select('*')
      .limit(100);
    
    // Check if we have any data
    const hasAdminData = adminData && adminData.length > 0;
    const hasRegularData = regularData && regularData.length > 0;
    
    if (!hasAdminData && !hasRegularData) {
      console.log(`API - debug/database: No data found in table ${table}`);
      
      // Check if the table exists
      const { data: tables, error: tablesError } = await (supabaseAdmin || supabase)
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      return res.status(200).json({ 
        table,
        exists: tables?.some(t => t.table_name === table) || false,
        adminError,
        regularError,
        tables: tables?.map(t => t.table_name) || [],
        tablesError
      });
    }
    
    // Return the data
    return res.status(200).json({ 
      table,
      adminCount: adminData?.length || 0,
      regularCount: regularData?.length || 0,
      adminData: adminData || [],
      regularData: regularData || [],
      adminError,
      regularError
    });
  } catch (error) {
    console.error('API - debug/database: Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 