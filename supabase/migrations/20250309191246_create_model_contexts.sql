-- Create model_contexts table for Model Context Protocol
CREATE TABLE IF NOT EXISTS model_contexts (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS model_contexts_key_idx ON model_contexts (key);
CREATE INDEX IF NOT EXISTS model_contexts_user_id_idx ON model_contexts (user_id);

-- Enable Row Level Security (RLS) on the table
ALTER TABLE model_contexts ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to only see their own data
CREATE POLICY "Users can view their own model contexts" 
    ON model_contexts 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Create a policy that allows users to insert their own data
CREATE POLICY "Users can insert their own model contexts" 
    ON model_contexts 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Create a policy that allows users to update their own data
CREATE POLICY "Users can update their own model contexts" 
    ON model_contexts 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Create a policy that allows users to delete their own data
CREATE POLICY "Users can delete their own model contexts" 
    ON model_contexts 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_model_contexts_updated_at
BEFORE UPDATE ON model_contexts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
