-- Add user_id column to conversations table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'conversations'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE conversations
        ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Add index for user_id
        CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
        
        -- Update RLS policies to include user_id
        DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
        CREATE POLICY "Users can view their own conversations"
          ON conversations FOR SELECT
          USING (
            project_id IN (
              SELECT id FROM projects WHERE user_id = auth.uid()
            ) OR user_id = auth.uid()
          );
        
        DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversations;
        CREATE POLICY "Users can insert their own conversations"
          ON conversations FOR INSERT
          WITH CHECK (
            (project_id IN (
              SELECT id FROM projects WHERE user_id = auth.uid()
            ) AND user_id = auth.uid())
          );
        
        DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
        CREATE POLICY "Users can update their own conversations"
          ON conversations FOR UPDATE
          USING (
            project_id IN (
              SELECT id FROM projects WHERE user_id = auth.uid()
            ) OR user_id = auth.uid()
          )
          WITH CHECK (
            project_id IN (
              SELECT id FROM projects WHERE user_id = auth.uid()
            ) OR user_id = auth.uid()
          );
        
        DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;
        CREATE POLICY "Users can delete their own conversations"
          ON conversations FOR DELETE
          USING (
            project_id IN (
              SELECT id FROM projects WHERE user_id = auth.uid()
            ) OR user_id = auth.uid()
          );
    END IF;
END $$; 