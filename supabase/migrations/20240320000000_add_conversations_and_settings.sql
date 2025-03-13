-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for conversations
CREATE INDEX IF NOT EXISTS conversations_project_id_idx ON conversations(project_id);
CREATE INDEX IF NOT EXISTS conversations_created_at_idx ON conversations(created_at);

-- Add trigger for conversations updated_at
CREATE TRIGGER set_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- Enable RLS for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
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

CREATE POLICY "Users can delete their own conversations"
  ON conversations FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Create project_settings table
CREATE TABLE IF NOT EXISTS project_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, key)
);

-- Add indexes for project_settings
CREATE INDEX IF NOT EXISTS project_settings_project_id_idx ON project_settings(project_id);
CREATE INDEX IF NOT EXISTS project_settings_key_idx ON project_settings(key);

-- Add trigger for project_settings updated_at
CREATE TRIGGER set_project_settings_updated_at
  BEFORE UPDATE ON project_settings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- Enable RLS for project_settings
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for project_settings
CREATE POLICY "Users can view their own project settings"
  ON project_settings FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own project settings"
  ON project_settings FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own project settings"
  ON project_settings FOR UPDATE
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

CREATE POLICY "Users can delete their own project settings"
  ON project_settings FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  ); 