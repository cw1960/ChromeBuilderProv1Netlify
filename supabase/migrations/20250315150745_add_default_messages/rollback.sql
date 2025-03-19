-- Remove default value from messages column in conversations table
ALTER TABLE conversations 
ALTER COLUMN messages DROP DEFAULT; 