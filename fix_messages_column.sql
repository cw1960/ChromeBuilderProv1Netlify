-- Ensure messages column has a default value of an empty array
ALTER TABLE conversations
ALTER COLUMN messages SET DEFAULT '[]'::jsonb;

-- Update any existing NULL values to empty array
UPDATE conversations
SET messages = '[]'::jsonb
WHERE messages IS NULL; 