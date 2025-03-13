-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for conversations
CREATE INDEX IF NOT EXISTS conversations_project_id_idx ON conversations (project_id);
CREATE INDEX IF NOT EXISTS conversations_created_at_idx ON conversations (created_at DESC);

-- Enable RLS on conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for conversations
CREATE POLICY "Users can view their own conversations" 
    ON conversations 
    FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = conversations.project_id 
        AND projects.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own conversations" 
    ON conversations 
    FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = conversations.project_id 
        AND projects.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own conversations" 
    ON conversations 
    FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = conversations.project_id 
        AND projects.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own conversations" 
    ON conversations 
    FOR DELETE 
    USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = conversations.project_id 
        AND projects.user_id = auth.uid()
    ));

-- Create project_settings table
CREATE TABLE IF NOT EXISTS project_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, key)
);

-- Add indexes for project_settings
CREATE INDEX IF NOT EXISTS project_settings_project_id_idx ON project_settings (project_id);
CREATE INDEX IF NOT EXISTS project_settings_key_idx ON project_settings (key);

-- Enable RLS on project_settings
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_settings
CREATE POLICY "Users can view their own project settings" 
    ON project_settings 
    FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = project_settings.project_id 
        AND projects.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own project settings" 
    ON project_settings 
    FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = project_settings.project_id 
        AND projects.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own project settings" 
    ON project_settings 
    FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = project_settings.project_id 
        AND projects.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own project settings" 
    ON project_settings 
    FOR DELETE 
    USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = project_settings.project_id 
        AND projects.user_id = auth.uid()
    ));

-- Add triggers for updated_at
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_project_settings_updated_at
    BEFORE UPDATE ON project_settings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- Add some common project settings
INSERT INTO project_settings (project_id, key, value)
SELECT 
    id as project_id,
    'build_settings' as key,
    jsonb_build_object(
        'target_browser', 'chrome',
        'manifest_version', 3,
        'build_mode', 'development'
    ) as value
FROM projects
ON CONFLICT (project_id, key) DO NOTHING; 