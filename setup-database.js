// Script to set up the Supabase database structure from scratch
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Use the provided Supabase credentials
const supabaseUrl = 'https://dfztfzxuplkzfggnzfwk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmenRmenh1cGxremZnZ256ZndrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTg5NTQwNiwiZXhwIjoyMDU3NDcxNDA2fQ.cOdTf_CljrekACqEacfFf10a6dg8KfaxqfB84NcdqDY';

// Create Supabase admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('=== SETTING UP DATABASE STRUCTURE ===');
    
    // 1. Create projects table
    console.log('\n1. Creating projects table...');
    const { error: projectsError } = await supabaseAdmin.rpc('create_table_if_not_exists', {
      table_name: 'projects',
      columns: `
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        version TEXT NOT NULL,
        manifest JSONB NOT NULL,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      `
    });
    
    if (projectsError) {
      console.error('Error creating projects table:', projectsError);
      
      // Try direct SQL approach if RPC fails
      console.log('Trying direct SQL approach...');
      const { error: sqlProjectsError } = await supabaseAdmin.from('_sql').select('*').execute(`
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
      `);
      
      if (sqlProjectsError) {
        console.error('Error with direct SQL for projects table:', sqlProjectsError);
      } else {
        console.log('✅ Projects table created successfully with direct SQL');
      }
    } else {
      console.log('✅ Projects table created successfully');
    }
    
    // 2. Create extension_files table
    console.log('\n2. Creating extension_files table...');
    const { error: filesError } = await supabaseAdmin.rpc('create_table_if_not_exists', {
      table_name: 'extension_files',
      columns: `
        id UUID PRIMARY KEY,
        project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        file_type TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      `
    });
    
    if (filesError) {
      console.error('Error creating extension_files table:', filesError);
      
      // Try direct SQL approach if RPC fails
      console.log('Trying direct SQL approach...');
      const { error: sqlFilesError } = await supabaseAdmin.from('_sql').select('*').execute(`
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
      `);
      
      if (sqlFilesError) {
        console.error('Error with direct SQL for extension_files table:', sqlFilesError);
      } else {
        console.log('✅ Extension_files table created successfully with direct SQL');
      }
    } else {
      console.log('✅ Extension_files table created successfully');
    }
    
    // 3. Create project_settings table
    console.log('\n3. Creating project_settings table...');
    const { error: settingsError } = await supabaseAdmin.rpc('create_table_if_not_exists', {
      table_name: 'project_settings',
      columns: `
        id SERIAL PRIMARY KEY,
        project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
        key TEXT NOT NULL,
        value JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(project_id, key)
      `
    });
    
    if (settingsError) {
      console.error('Error creating project_settings table:', settingsError);
      
      // Try direct SQL approach if RPC fails
      console.log('Trying direct SQL approach...');
      const { error: sqlSettingsError } = await supabaseAdmin.from('_sql').select('*').execute(`
        CREATE TABLE IF NOT EXISTS public.project_settings (
          id SERIAL PRIMARY KEY,
          project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
          key TEXT NOT NULL,
          value JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(project_id, key)
        );
      `);
      
      if (sqlSettingsError) {
        console.error('Error with direct SQL for project_settings table:', sqlSettingsError);
      } else {
        console.log('✅ Project_settings table created successfully with direct SQL');
      }
    } else {
      console.log('✅ Project_settings table created successfully');
    }
    
    // 4. Create conversations table
    console.log('\n4. Creating conversations table...');
    const { error: conversationsError } = await supabaseAdmin.rpc('create_table_if_not_exists', {
      table_name: 'conversations',
      columns: `
        id UUID PRIMARY KEY,
        project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        messages JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      `
    });
    
    if (conversationsError) {
      console.error('Error creating conversations table:', conversationsError);
      
      // Try direct SQL approach if RPC fails
      console.log('Trying direct SQL approach...');
      const { error: sqlConversationsError } = await supabaseAdmin.from('_sql').select('*').execute(`
        CREATE TABLE IF NOT EXISTS public.conversations (
          id UUID PRIMARY KEY,
          project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          messages JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      
      if (sqlConversationsError) {
        console.error('Error with direct SQL for conversations table:', sqlConversationsError);
      } else {
        console.log('✅ Conversations table created successfully with direct SQL');
      }
    } else {
      console.log('✅ Conversations table created successfully');
    }
    
    // 5. Create deployment_history table
    console.log('\n5. Creating deployment_history table...');
    const { error: deploymentError } = await supabaseAdmin.rpc('create_table_if_not_exists', {
      table_name: 'deployment_history',
      columns: `
        id UUID PRIMARY KEY,
        project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
        version TEXT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        files JSONB NOT NULL,
        notes TEXT,
        status TEXT NOT NULL,
        publish_url TEXT
      `
    });
    
    if (deploymentError) {
      console.error('Error creating deployment_history table:', deploymentError);
      
      // Try direct SQL approach if RPC fails
      console.log('Trying direct SQL approach...');
      const { error: sqlDeploymentError } = await supabaseAdmin.from('_sql').select('*').execute(`
        CREATE TABLE IF NOT EXISTS public.deployment_history (
          id UUID PRIMARY KEY,
          project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
          version TEXT NOT NULL,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          files JSONB NOT NULL,
          notes TEXT,
          status TEXT NOT NULL,
          publish_url TEXT
        );
      `);
      
      if (sqlDeploymentError) {
        console.error('Error with direct SQL for deployment_history table:', sqlDeploymentError);
      } else {
        console.log('✅ Deployment_history table created successfully with direct SQL');
      }
    } else {
      console.log('✅ Deployment_history table created successfully');
    }
    
    // 6. Create user_subscriptions table for future Stripe integration
    console.log('\n6. Creating user_subscriptions table...');
    const { error: subscriptionsError } = await supabaseAdmin.rpc('create_table_if_not_exists', {
      table_name: 'user_subscriptions',
      columns: `
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        plan_type TEXT NOT NULL,
        status TEXT NOT NULL,
        current_period_start TIMESTAMPTZ,
        current_period_end TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      `
    });
    
    if (subscriptionsError) {
      console.error('Error creating user_subscriptions table:', subscriptionsError);
      
      // Try direct SQL approach if RPC fails
      console.log('Trying direct SQL approach...');
      const { error: sqlSubscriptionsError } = await supabaseAdmin.from('_sql').select('*').execute(`
        CREATE TABLE IF NOT EXISTS public.user_subscriptions (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          stripe_customer_id TEXT,
          stripe_subscription_id TEXT,
          plan_type TEXT NOT NULL,
          status TEXT NOT NULL,
          current_period_start TIMESTAMPTZ,
          current_period_end TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      
      if (sqlSubscriptionsError) {
        console.error('Error with direct SQL for user_subscriptions table:', sqlSubscriptionsError);
      } else {
        console.log('✅ User_subscriptions table created successfully with direct SQL');
      }
    } else {
      console.log('✅ User_subscriptions table created successfully');
    }
    
    // 7. Set up Row Level Security (RLS) policies
    console.log('\n7. Setting up Row Level Security (RLS) policies...');
    
    // Enable RLS on all tables
    const tables = ['projects', 'extension_files', 'project_settings', 'conversations', 'deployment_history', 'user_subscriptions'];
    
    for (const table of tables) {
      console.log(`\nEnabling RLS on ${table} table...`);
      const { error: rlsError } = await supabaseAdmin.from('_sql').select('*').execute(`
        ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;
      `);
      
      if (rlsError) {
        console.error(`Error enabling RLS on ${table} table:`, rlsError);
      } else {
        console.log(`✅ RLS enabled on ${table} table`);
      }
      
      // Create policies for each table
      console.log(`Creating policies for ${table} table...`);
      
      // Select policy - users can only select their own data
      const { error: selectPolicyError } = await supabaseAdmin.from('_sql').select('*').execute(`
        CREATE POLICY "Users can select their own ${table}" ON public.${table}
        FOR SELECT
        USING (auth.uid() = user_id);
      `);
      
      if (selectPolicyError) {
        console.error(`Error creating select policy for ${table} table:`, selectPolicyError);
      } else {
        console.log(`✅ Select policy created for ${table} table`);
      }
      
      // Insert policy - users can only insert their own data
      const { error: insertPolicyError } = await supabaseAdmin.from('_sql').select('*').execute(`
        CREATE POLICY "Users can insert their own ${table}" ON public.${table}
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
      `);
      
      if (insertPolicyError) {
        console.error(`Error creating insert policy for ${table} table:`, insertPolicyError);
      } else {
        console.log(`✅ Insert policy created for ${table} table`);
      }
      
      // Update policy - users can only update their own data
      const { error: updatePolicyError } = await supabaseAdmin.from('_sql').select('*').execute(`
        CREATE POLICY "Users can update their own ${table}" ON public.${table}
        FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
      `);
      
      if (updatePolicyError) {
        console.error(`Error creating update policy for ${table} table:`, updatePolicyError);
      } else {
        console.log(`✅ Update policy created for ${table} table`);
      }
      
      // Delete policy - users can only delete their own data
      const { error: deletePolicyError } = await supabaseAdmin.from('_sql').select('*').execute(`
        CREATE POLICY "Users can delete their own ${table}" ON public.${table}
        FOR DELETE
        USING (auth.uid() = user_id);
      `);
      
      if (deletePolicyError) {
        console.error(`Error creating delete policy for ${table} table:`, deletePolicyError);
      } else {
        console.log(`✅ Delete policy created for ${table} table`);
      }
    }
    
    // Special policies for tables that reference projects
    const referencingTables = ['extension_files', 'project_settings', 'conversations', 'deployment_history'];
    
    for (const table of referencingTables) {
      console.log(`\nCreating special policies for ${table} table...`);
      
      // Select policy - users can select data for projects they own
      const { error: projectSelectPolicyError } = await supabaseAdmin.from('_sql').select('*').execute(`
        CREATE POLICY "Users can select ${table} for projects they own" ON public.${table}
        FOR SELECT
        USING (
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
          )
        );
      `);
      
      if (projectSelectPolicyError) {
        console.error(`Error creating project select policy for ${table} table:`, projectSelectPolicyError);
      } else {
        console.log(`✅ Project select policy created for ${table} table`);
      }
      
      // Insert policy - users can insert data for projects they own
      const { error: projectInsertPolicyError } = await supabaseAdmin.from('_sql').select('*').execute(`
        CREATE POLICY "Users can insert ${table} for projects they own" ON public.${table}
        FOR INSERT
        WITH CHECK (
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
          )
        );
      `);
      
      if (projectInsertPolicyError) {
        console.error(`Error creating project insert policy for ${table} table:`, projectInsertPolicyError);
      } else {
        console.log(`✅ Project insert policy created for ${table} table`);
      }
      
      // Update policy - users can update data for projects they own
      const { error: projectUpdatePolicyError } = await supabaseAdmin.from('_sql').select('*').execute(`
        CREATE POLICY "Users can update ${table} for projects they own" ON public.${table}
        FOR UPDATE
        USING (
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
          )
        )
        WITH CHECK (
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
          )
        );
      `);
      
      if (projectUpdatePolicyError) {
        console.error(`Error creating project update policy for ${table} table:`, projectUpdatePolicyError);
      } else {
        console.log(`✅ Project update policy created for ${table} table`);
      }
      
      // Delete policy - users can delete data for projects they own
      const { error: projectDeletePolicyError } = await supabaseAdmin.from('_sql').select('*').execute(`
        CREATE POLICY "Users can delete ${table} for projects they own" ON public.${table}
        FOR DELETE
        USING (
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
          )
        );
      `);
      
      if (projectDeletePolicyError) {
        console.error(`Error creating project delete policy for ${table} table:`, projectDeletePolicyError);
      } else {
        console.log(`✅ Project delete policy created for ${table} table`);
      }
    }
    
    // 8. Create indexes for performance
    console.log('\n8. Creating indexes for performance...');
    
    // Index on projects.user_id
    const { error: projectsIndexError } = await supabaseAdmin.from('_sql').select('*').execute(`
      CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects (user_id);
    `);
    
    if (projectsIndexError) {
      console.error('Error creating index on projects.user_id:', projectsIndexError);
    } else {
      console.log('✅ Index created on projects.user_id');
    }
    
    // Index on extension_files.project_id
    const { error: filesIndexError } = await supabaseAdmin.from('_sql').select('*').execute(`
      CREATE INDEX IF NOT EXISTS extension_files_project_id_idx ON public.extension_files (project_id);
    `);
    
    if (filesIndexError) {
      console.error('Error creating index on extension_files.project_id:', filesIndexError);
    } else {
      console.log('✅ Index created on extension_files.project_id');
    }
    
    // Index on project_settings.project_id
    const { error: settingsIndexError } = await supabaseAdmin.from('_sql').select('*').execute(`
      CREATE INDEX IF NOT EXISTS project_settings_project_id_idx ON public.project_settings (project_id);
    `);
    
    if (settingsIndexError) {
      console.error('Error creating index on project_settings.project_id:', settingsIndexError);
    } else {
      console.log('✅ Index created on project_settings.project_id');
    }
    
    // Index on conversations.project_id
    const { error: conversationsIndexError } = await supabaseAdmin.from('_sql').select('*').execute(`
      CREATE INDEX IF NOT EXISTS conversations_project_id_idx ON public.conversations (project_id);
    `);
    
    if (conversationsIndexError) {
      console.error('Error creating index on conversations.project_id:', conversationsIndexError);
    } else {
      console.log('✅ Index created on conversations.project_id');
    }
    
    // Index on deployment_history.project_id
    const { error: deploymentIndexError } = await supabaseAdmin.from('_sql').select('*').execute(`
      CREATE INDEX IF NOT EXISTS deployment_history_project_id_idx ON public.deployment_history (project_id);
    `);
    
    if (deploymentIndexError) {
      console.error('Error creating index on deployment_history.project_id:', deploymentIndexError);
    } else {
      console.log('✅ Index created on deployment_history.project_id');
    }
    
    // Index on user_subscriptions.user_id
    const { error: subscriptionsIndexError } = await supabaseAdmin.from('_sql').select('*').execute(`
      CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON public.user_subscriptions (user_id);
    `);
    
    if (subscriptionsIndexError) {
      console.error('Error creating index on user_subscriptions.user_id:', subscriptionsIndexError);
    } else {
      console.log('✅ Index created on user_subscriptions.user_id');
    }
    
    console.log('\n=== DATABASE SETUP COMPLETE ===');
    
  } catch (error) {
    console.error('Unexpected error during database setup:', error);
  }
}

setupDatabase(); 