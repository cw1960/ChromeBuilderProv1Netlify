-- Drop existing conversation_entries table if it exists
DROP TABLE IF EXISTS conversation_entries;

-- Create conversation_entries table with correct structure
CREATE TABLE conversation_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT fk_project
        FOREIGN KEY(project_id) 
        REFERENCES projects(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_conversation
        FOREIGN KEY(conversation_id) 
        REFERENCES conversations(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_conversation_entries_project_id 
ON conversation_entries(project_id);

CREATE INDEX idx_conversation_entries_conversation_id 
ON conversation_entries(conversation_id);

CREATE INDEX idx_conversation_entries_user_id 
ON conversation_entries(user_id); 