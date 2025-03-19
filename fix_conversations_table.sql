-- Comprehensive fix for conversations table
DO $$
BEGIN
    -- 1. Check if user_id column exists and add it if it doesn't
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

    -- 2. Check if metadata column exists and add it if it doesn't
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'conversations'
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE conversations
        ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}';
    END IF;

    -- 3. Ensure messages column has the correct default value
    ALTER TABLE conversations 
    ALTER COLUMN messages SET DEFAULT '[]'::jsonb;

    -- 4. Ensure id column has the correct default value
    ALTER TABLE conversations 
    ALTER COLUMN id SET DEFAULT uuid_generate_v4();

    -- 5. Update any existing NULL values in messages column
    UPDATE conversations 
    SET messages = '[]'::jsonb 
    WHERE messages IS NULL;

    -- 6. Update any existing NULL values in metadata column
    UPDATE conversations 
    SET metadata = '{}'::jsonb 
    WHERE metadata IS NULL;
END $$;

-- Check the current schema after fixes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'conversations'
ORDER BY 
    ordinal_position; 