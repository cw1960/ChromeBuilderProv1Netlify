-- Drop and recreate deployment_history table with correct columns
DROP TABLE IF EXISTS deployment_history;

CREATE TABLE deployment_history (
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

-- Create index
CREATE INDEX idx_deployment_history_project_id 
ON deployment_history(project_id); 