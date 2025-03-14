# Supabase Database Setup for ChromeBuilder Pro

This document provides instructions on how to set up the Supabase database for ChromeBuilder Pro.

## Prerequisites

- Node.js and npm installed
- A Supabase account and project
- The Supabase URL and API keys (anon key and service role key)

## Setup Steps

1. **Update Environment Variables**

   Update the `.env.local` file with your Supabase credentials:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   You can use the `update-env.js` script to update these values:

   ```bash
   node update-env.js
   ```

2. **Create a User**

   Create a user in the Supabase auth system:

   ```bash
   node create-user.js
   ```

   This will create a test user with a random email and the password `Password123!`.

3. **Set Up Database Tables**

   Set up the database tables using the `setup-tables.js` script:

   ```bash
   node setup-tables.js
   ```

   This script will create the following tables:
   - `projects`: Stores project metadata
   - `extension_files`: Stores project files
   - `project_settings`: Stores project settings
   - `conversations`: Stores conversations related to projects

4. **Verify Database Setup**

   Verify that the database is set up correctly by running the `test-project-creation.js` script:

   ```bash
   node test-project-creation.js
   ```

   This script will create a test project, files, settings, and a conversation, and then verify that they can be retrieved from the database.

5. **Restart the Application**

   Restart the application to use the new Supabase database:

   ```bash
   pkill -f "node.*server.js" && npm run dev
   ```

## Database Schema

### Projects Table

```sql
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL,
  manifest JSONB NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Extension Files Table

```sql
CREATE TABLE IF NOT EXISTS public.extension_files (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Project Settings Table

```sql
CREATE TABLE IF NOT EXISTS public.project_settings (
  id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, key)
);
```

### Conversations Table

```sql
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Row Level Security (RLS) Policies

For security, Row Level Security (RLS) policies should be set up for each table. These policies ensure that users can only access their own data.

You can set up RLS policies using the SQL script in `setup-database.sql`.

## Troubleshooting

If you encounter any issues with the database setup, check the following:

1. Make sure your Supabase credentials are correct in the `.env.local` file.
2. Verify that the Supabase project has the necessary permissions.
3. Check the Supabase logs for any errors.
4. Run the verification scripts to check if the database is set up correctly.

## Additional Scripts

- `verify-connection.js`: Verifies the connection to the Supabase database.
- `setup-database.sql`: SQL script to set up the database tables and RLS policies.
- `setup-database-direct.js`: Alternative script to set up the database using direct SQL queries.

## Manual Setup in Supabase SQL Editor

If the scripts don't work, you can manually set up the database using the SQL script in `setup-database.sql`. Copy the contents of this file and run it in the Supabase SQL Editor. 