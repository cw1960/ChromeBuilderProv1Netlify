-- Fix the schema cache issue for the conversations table
BEGIN;

-- Ensure the metadata column exists with the correct type and default value
DO $$
BEGIN
    -- Check if metadata column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'metadata'
    ) THEN
        -- Add metadata column if it doesn't exist
        ALTER TABLE conversations ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb NOT NULL;
    ELSE
        -- Ensure metadata column has the correct type and default
        ALTER TABLE conversations ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;
        ALTER TABLE conversations ALTER COLUMN metadata SET NOT NULL;
        
        -- Update any NULL values to empty JSON object
        UPDATE conversations SET metadata = '{}'::jsonb WHERE metadata IS NULL;
    END IF;
    
    -- Ensure messages column has the correct default
    ALTER TABLE conversations ALTER COLUMN messages SET DEFAULT '[]'::jsonb;
    ALTER TABLE conversations ALTER COLUMN messages SET NOT NULL;
    
    -- Update any NULL values in messages to empty array
    UPDATE conversations SET messages = '[]'::jsonb WHERE messages IS NULL;
    
    -- Ensure id column has the correct default
    ALTER TABLE conversations ALTER COLUMN id SET DEFAULT uuid_generate_v4();
    
    -- Ensure user_id column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE conversations ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- This is the most important part - refresh the schema cache for PostgREST
SELECT pg_notify('pgrst', 'reload schema');

COMMIT; 