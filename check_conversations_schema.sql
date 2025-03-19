-- Check the current schema of the conversations table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'conversations'
ORDER BY 
    ordinal_position;

-- Check if user_id column exists
SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'user_id'
); 