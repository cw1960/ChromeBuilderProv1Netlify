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