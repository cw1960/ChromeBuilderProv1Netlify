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

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    version TEXT NOT NULL DEFAULT '0.1.0',
    manifest JSONB NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for projects
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects (user_id);

-- Enable RLS on projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects" 
    ON projects 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" 
    ON projects 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
    ON projects 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
    ON projects 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Create project_files table
CREATE TABLE IF NOT EXISTS project_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, path)
);

-- Add indexes for project_files
CREATE INDEX IF NOT EXISTS project_files_project_id_idx ON project_files (project_id);

-- Enable RLS on project_files
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_files
CREATE POLICY "Users can view their own project files" 
    ON project_files 
    FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = project_files.project_id 
        AND projects.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own project files" 
    ON project_files 
    FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = project_files.project_id 
        AND projects.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own project files" 
    ON project_files 
    FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = project_files.project_id 
        AND projects.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own project files" 
    ON project_files 
    FOR DELETE 
    USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = project_files.project_id 
        AND projects.user_id = auth.uid()
    ));

-- Create deployment_history table
CREATE TABLE IF NOT EXISTS deployment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    notes TEXT,
    files JSONB NOT NULL,
    status TEXT NOT NULL,
    publish_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for deployment_history
CREATE INDEX IF NOT EXISTS deployment_history_project_id_idx ON deployment_history (project_id);

-- Enable RLS on deployment_history
ALTER TABLE deployment_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for deployment_history
CREATE POLICY "Users can view their own deployment history" 
    ON deployment_history 
    FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = deployment_history.project_id 
        AND projects.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert their own deployment history" 
    ON deployment_history 
    FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = deployment_history.project_id 
        AND projects.user_id = auth.uid()
    ));

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_model_contexts_updated_at
BEFORE UPDATE ON model_contexts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_files_updated_at
BEFORE UPDATE ON project_files
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
