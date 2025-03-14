import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Initialize Supabase admin client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Create Table API: Missing Supabase configuration');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('Create Table API: Creating conversation_entries table');
    
    // Execute the SQL directly using rpc
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      query: `
        -- Create conversation_entries table
        CREATE TABLE IF NOT EXISTS conversation_entries (
          id UUID PRIMARY KEY,
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `
    });
    
    if (error) {
      console.error('Create Table API: Error creating conversation_entries table:', error);
      return res.status(500).json({ 
        message: 'Error creating conversation_entries table',
        error: error.message
      });
    }
    
    // Add indexes
    const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
      query: `
        CREATE INDEX IF NOT EXISTS conversation_entries_project_id_idx ON conversation_entries(project_id);
        CREATE INDEX IF NOT EXISTS conversation_entries_timestamp_idx ON conversation_entries(timestamp);
      `
    });
    
    if (indexError) {
      console.error('Create Table API: Error creating indexes:', indexError);
      // Continue anyway
    }
    
    // Create trigger function if it doesn't exist
    const { error: triggerFnError } = await supabaseAdmin.rpc('exec_sql', {
      query: `
        CREATE OR REPLACE FUNCTION trigger_set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (triggerFnError) {
      console.error('Create Table API: Error creating trigger function:', triggerFnError);
      // Continue anyway
    }
    
    // Add trigger
    const { error: triggerError } = await supabaseAdmin.rpc('exec_sql', {
      query: `
        CREATE TRIGGER set_conversation_entries_updated_at
          BEFORE UPDATE ON conversation_entries
          FOR EACH ROW
          EXECUTE FUNCTION trigger_set_updated_at();
      `
    });
    
    if (triggerError) {
      console.error('Create Table API: Error creating trigger:', triggerError);
      // Continue anyway
    }
    
    // Enable RLS
    const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
      query: `
        ALTER TABLE conversation_entries ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (rlsError) {
      console.error('Create Table API: Error enabling RLS:', rlsError);
      // Continue anyway
    }
    
    // Add RLS policies
    const { error: policyError } = await supabaseAdmin.rpc('exec_sql', {
      query: `
        CREATE POLICY "Users can view their own conversation entries"
          ON conversation_entries FOR SELECT
          USING (
            project_id IN (
              SELECT id FROM projects WHERE user_id = auth.uid()
            )
          );

        CREATE POLICY "Users can insert their own conversation entries"
          ON conversation_entries FOR INSERT
          WITH CHECK (
            project_id IN (
              SELECT id FROM projects WHERE user_id = auth.uid()
            )
          );

        CREATE POLICY "Users can update their own conversation entries"
          ON conversation_entries FOR UPDATE
          USING (
            project_id IN (
              SELECT id FROM projects WHERE user_id = auth.uid()
            )
          )
          WITH CHECK (
            project_id IN (
              SELECT id FROM projects WHERE user_id = auth.uid()
            )
          );

        CREATE POLICY "Users can delete their own conversation entries"
          ON conversation_entries FOR DELETE
          USING (
            project_id IN (
              SELECT id FROM projects WHERE user_id = auth.uid()
            )
          );
      `
    });
    
    if (policyError) {
      console.error('Create Table API: Error creating RLS policies:', policyError);
      // Continue anyway
    }
    
    console.log('Create Table API: Successfully created conversation_entries table');
    
    return res.status(200).json({
      message: 'Conversation entries table created successfully'
    });
  } catch (error) {
    console.error('Create Table API: Unexpected error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 