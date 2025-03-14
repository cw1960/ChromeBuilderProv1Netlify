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
      console.error('Run Migration API: Missing Supabase configuration');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('Run Migration API: Creating conversation_entries table');
    
    // SQL to create the conversation_entries table
    const sql = `
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

    -- Add indexes for conversation_entries
    CREATE INDEX IF NOT EXISTS conversation_entries_project_id_idx ON conversation_entries(project_id);
    CREATE INDEX IF NOT EXISTS conversation_entries_timestamp_idx ON conversation_entries(timestamp);

    -- Add trigger for conversation_entries updated_at
    CREATE OR REPLACE FUNCTION trigger_set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER set_conversation_entries_updated_at
      BEFORE UPDATE ON conversation_entries
      FOR EACH ROW
      EXECUTE FUNCTION trigger_set_updated_at();

    -- Enable RLS for conversation_entries
    ALTER TABLE conversation_entries ENABLE ROW LEVEL SECURITY;

    -- Add RLS policies for conversation_entries
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
    `;
    
    // Execute the SQL
    const { error } = await supabaseAdmin.rpc('pgmigrate', { sql });
    
    if (error) {
      console.error('Run Migration API: Error creating conversation_entries table:', error);
      
      // Try direct SQL approach if RPC fails
      console.log('Run Migration API: Trying direct SQL approach');
      
      // Split the SQL into individual statements
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
      
      let hasError = false;
      
      for (const statement of statements) {
        const { error: sqlError } = await supabaseAdmin.rpc('pgmigrate', { 
          sql: statement.trim() + ';' 
        });
        
        if (sqlError) {
          console.error('Run Migration API: Error executing SQL statement:', sqlError);
          hasError = true;
        }
      }
      
      if (hasError) {
        return res.status(500).json({ 
          message: 'Error creating conversation_entries table',
          error: error.message
        });
      }
    }
    
    console.log('Run Migration API: Successfully created conversation_entries table');
    
    return res.status(200).json({
      message: 'Migration executed successfully'
    });
  } catch (error) {
    console.error('Run Migration API: Unexpected error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 