import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

// Environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Initialize Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function mcpApiHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get the session from NextAuth
    const session = await getServerSession(req, res, authOptions);
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { method, query, body } = req;
    const path = query.path as string[];
    const key = path.join('/');
    
    // Handle different HTTP methods
    switch (method) {
      case 'GET':
        // Get a model context
        const { data: getData, error: getError } = await supabase
          .from('model_contexts')
          .select('value')
          .eq('key', key)
          .eq('user_id', session.user.id)
          .single();
        
        if (getError) {
          if (getError.code === 'PGRST116') {
            // Not found
            return res.status(404).json({ error: 'Not found' });
          }
          return res.status(500).json({ error: getError.message });
        }
        
        return res.status(200).json(getData.value);
      
      case 'POST':
      case 'PUT':
        // Create or update a model context
        const { data: upsertData, error: upsertError } = await supabase
          .from('model_contexts')
          .upsert({
            key,
            value: body,
            user_id: session.user.id,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (upsertError) {
          return res.status(500).json({ error: upsertError.message });
        }
        
        return res.status(200).json({ success: true });
      
      case 'DELETE':
        // Delete a model context
        const { error: deleteError } = await supabase
          .from('model_contexts')
          .delete()
          .eq('key', key)
          .eq('user_id', session.user.id);
        
        if (deleteError) {
          return res.status(500).json({ error: deleteError.message });
        }
        
        return res.status(200).json({ success: true });
      
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in MCP API handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Configure API to use bodyParser
export const config = {
  api: {
    bodyParser: true,
  },
};