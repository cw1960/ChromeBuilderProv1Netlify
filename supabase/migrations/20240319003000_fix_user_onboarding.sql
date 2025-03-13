-- Drop existing table if it exists
DROP TABLE IF EXISTS user_onboarding;

-- Create user_onboarding table
CREATE TABLE user_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  dev_experience TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own onboarding data"
  ON user_onboarding
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding data"
  ON user_onboarding
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding data"
  ON user_onboarding
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at(); 