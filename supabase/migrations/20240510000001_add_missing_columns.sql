-- Add title column to conversations table
ALTER TABLE IF EXISTS conversations 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Create deployment_history table
CREATE TABLE IF NOT EXISTS deployment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    version TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT fk_project
        FOREIGN KEY(project_id) 
        REFERENCES projects(id)
        ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deployment_history_project_id 
ON deployment_history(project_id);

-- Ensure conversations table exists with all required columns
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    user_id UUID NOT NULL,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_project
        FOREIGN KEY(project_id) 
        REFERENCES projects(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Create indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_project_id 
ON conversations(project_id);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id 
ON conversations(user_id); 