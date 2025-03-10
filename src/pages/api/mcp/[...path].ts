import { NextApiRequest, NextApiResponse } from 'next';
import { createMcpHandler } from '@smithery/server';
import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Initialize Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create MCP handler with Supabase adapter
const handler = createMcpHandler({
  // Use the smithery-provided Supabase adapter
  adapter: 'supabase',
  
  // Supabase configuration options
  config: {
    supabaseClient: supabase,
    tableName: 'model_contexts', // Table where context data will be stored
  },
  
  // Authentication handler to validate requests
  auth: async (req) => {
    try {
      // Get the authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return null;
      }
      
      // Extract token
      const token = authHeader.substring(7);
      
      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        console.error('Authentication error:', error);
        return null;
      }
      
      // Return user data for context
      return {
        userId: user.id,
        email: user.email,
      };
    } catch (error) {
      console.error('Error in authentication:', error);
      return null;
    }
  },
  
  // Optional logging for development
  logger: process.env.NODE_ENV === 'development' 
    ? console 
    : undefined,
});

export default async function mcpApiHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Forward the request to the MCP handler
  return handler(req, res);
}

// Configure API to use bodyParser
export const config = {
  api: {
    bodyParser: true,
  },
};