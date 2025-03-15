// Script to set up the Supabase database structure using direct SQL queries
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Use the provided Supabase credentials
const supabaseUrl = 'https://dfztfzxuplkzfggnzfwk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmenRmenh1cGxremZnZ256ZndrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTg5NTQwNiwiZXhwIjoyMDU3NDcxNDA2fQ.cOdTf_CljrekACqEacfFf10a6dg8KfaxqfB84NcdqDY';

// Create Supabase admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function executeSql(sql) {
  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { query: sql });
    return { data, error };
  } catch (error) {
    console.error('Error executing SQL:', error);
    return { data: null, error };
  }
}

async function setupDatabase() {
  try {
    console.log('=== SETTING UP DATABASE STRUCTURE ===');
    
    // 1. Create projects table
    console.log('\n1. Creating projects table...');
    const projectsTableSql = `
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
    `;
    
    const { error: projectsError } = await executeSql(projectsTableSql);
    
    if (projectsError) {
      console.error('Error creating projects table:', projectsError);
    } else {
      console.log('✅ Projects table created successfully');
    }
    
    // 2. Create extension_files table
    console.log('\n2. Creating extension_files table...');
    const filesTableSql = `
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
    `;
    
    const { error: filesError } = await executeSql(filesTableSql);
    
    if (filesError) {
      console.error('Error creating extension_files table:', filesError);
    } else {
      console.log('✅ Extension_files table created successfully');
    }
    
    // 3. Create project_settings table
    console.log('\n3. Creating project_settings table...');
    const settingsTableSql = `
      CREATE TABLE IF NOT EXISTS public.project_settings (
        id SERIAL PRIMARY KEY,
        project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
        key TEXT NOT NULL,
        value JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(project_id, key)
      );
    `;
    
    const { error: settingsError } = await executeSql(settingsTableSql);
    
    if (settingsError) {
      console.error('Error creating project_settings table:', settingsError);
    } else {
      console.log('✅ Project_settings table created successfully');
    }
    
    // 4. Create conversations table
    console.log('\n4. Creating conversations table...');
    const conversationsTableSql = `
      CREATE TABLE IF NOT EXISTS public.conversations (
        id UUID PRIMARY KEY,
        project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        messages JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    
    const { error: conversationsError } = await executeSql(conversationsTableSql);
    
    if (conversationsError) {
      console.error('Error creating conversations table:', conversationsError);
    } else {
      console.log('✅ Conversations table created successfully');
    }
    
    // 5. Create deployment_history table
    console.log('\n5. Creating deployment_history table...');
    const deploymentTableSql = `
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
    `;
    
    const { error: deploymentError } = await executeSql(deploymentTableSql);
    
    if (deploymentError) {
      console.error('Error creating deployment_history table:', deploymentError);
    } else {
      console.log('✅ Deployment_history table created successfully');
    }
    
    // 6. Create user_subscriptions table for future Stripe integration
    console.log('\n6. Creating user_subscriptions table...');
    const subscriptionsTableSql = `
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
    `;
    
    const { error: subscriptionsError } = await executeSql(subscriptionsTableSql);
    
    if (subscriptionsError) {
      console.error('Error creating user_subscriptions table:', subscriptionsError);
    } else {
      console.log('✅ User_subscriptions table created successfully');
    }
    
    // 7. Set up Row Level Security (RLS) policies
    console.log('\n7. Setting up Row Level Security (RLS) policies...');
    
    // Enable RLS on all tables
    const tables = ['projects', 'extension_files', 'project_settings', 'conversations', 'deployment_history', 'user_subscriptions'];
    
    for (const table of tables) {
      console.log(`\nEnabling RLS on ${table} table...`);
      const rlsSql = `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`;
      
      const { error: rlsError } = await executeSql(rlsSql);
      
      if (rlsError) {
        console.error(`Error enabling RLS on ${table} table:`, rlsError);
      } else {
        console.log(`✅ RLS enabled on ${table} table`);
      }
      
      // Create policies for each table
      console.log(`Creating policies for ${table} table...`);
      
      // Select policy - users can only select their own data
      if (table === 'projects' || table === 'user_subscriptions') {
        const selectPolicySql = `
          CREATE POLICY "Users can select their own ${table}" ON public.${table}
          FOR SELECT
          USING (auth.uid() = user_id);
        `;
        
        const { error: selectPolicyError } = await executeSql(selectPolicySql);
        
        if (selectPolicyError) {
          console.error(`Error creating select policy for ${table} table:`, selectPolicyError);
        } else {
          console.log(`✅ Select policy created for ${table} table`);
        }
        
        // Insert policy - users can only insert their own data
        const insertPolicySql = `
          CREATE POLICY "Users can insert their own ${table}" ON public.${table}
          FOR INSERT
          WITH CHECK (auth.uid() = user_id);
        `;
        
        const { error: insertPolicyError } = await executeSql(insertPolicySql);
        
        if (insertPolicyError) {
          console.error(`Error creating insert policy for ${table} table:`, insertPolicyError);
        } else {
          console.log(`✅ Insert policy created for ${table} table`);
        }
        
        // Update policy - users can only update their own data
        const updatePolicySql = `
          CREATE POLICY "Users can update their own ${table}" ON public.${table}
          FOR UPDATE
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);
        `;
        
        const { error: updatePolicyError } = await executeSql(updatePolicySql);
        
        if (updatePolicyError) {
          console.error(`Error creating update policy for ${table} table:`, updatePolicyError);
        } else {
          console.log(`✅ Update policy created for ${table} table`);
        }
        
        // Delete policy - users can only delete their own data
        const deletePolicySql = `
          CREATE POLICY "Users can delete their own ${table}" ON public.${table}
          FOR DELETE
          USING (auth.uid() = user_id);
        `;
        
        const { error: deletePolicyError } = await executeSql(deletePolicySql);
        
        if (deletePolicyError) {
          console.error(`Error creating delete policy for ${table} table:`, deletePolicyError);
        } else {
          console.log(`✅ Delete policy created for ${table} table`);
        }
      }
    }
    
    // Special policies for tables that reference projects
    const referencingTables = ['extension_files', 'project_settings', 'conversations', 'deployment_history'];
    
    for (const table of referencingTables) {
      console.log(`\nCreating special policies for ${table} table...`);
      
      // Select policy - users can select data for projects they own
      const projectSelectPolicySql = `
        CREATE POLICY "Users can select ${table} for projects they own" ON public.${table}
        FOR SELECT
        USING (
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
          )
        );
      `;
      
      const { error: projectSelectPolicyError } = await executeSql(projectSelectPolicySql);
      
      if (projectSelectPolicyError) {
        console.error(`Error creating project select policy for ${table} table:`, projectSelectPolicyError);
      } else {
        console.log(`✅ Project select policy created for ${table} table`);
      }
      
      // Insert policy - users can insert data for projects they own
      const projectInsertPolicySql = `
        CREATE POLICY "Users can insert ${table} for projects they own" ON public.${table}
        FOR INSERT
        WITH CHECK (
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
          )
        );
      `;
      
      const { error: projectInsertPolicyError } = await executeSql(projectInsertPolicySql);
      
      if (projectInsertPolicyError) {
        console.error(`Error creating project insert policy for ${table} table:`, projectInsertPolicyError);
      } else {
        console.log(`✅ Project insert policy created for ${table} table`);
      }
      
      // Update policy - users can update data for projects they own
      const projectUpdatePolicySql = `
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
      `;
      
      const { error: projectUpdatePolicyError } = await executeSql(projectUpdatePolicySql);
      
      if (projectUpdatePolicyError) {
        console.error(`Error creating project update policy for ${table} table:`, projectUpdatePolicyError);
      } else {
        console.log(`✅ Project update policy created for ${table} table`);
      }
      
      // Delete policy - users can delete data for projects they own
      const projectDeletePolicySql = `
        CREATE POLICY "Users can delete ${table} for projects they own" ON public.${table}
        FOR DELETE
        USING (
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
          )
        );
      `;
      
      const { error: projectDeletePolicyError } = await executeSql(projectDeletePolicySql);
      
      if (projectDeletePolicyError) {
        console.error(`Error creating project delete policy for ${table} table:`, projectDeletePolicyError);
      } else {
        console.log(`✅ Project delete policy created for ${table} table`);
      }
    }
    
    // 8. Create indexes for performance
    console.log('\n8. Creating indexes for performance...');
    
    // Index on projects.user_id
    const projectsIndexSql = `CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects (user_id);`;
    
    const { error: projectsIndexError } = await executeSql(projectsIndexSql);
    
    if (projectsIndexError) {
      console.error('Error creating index on projects.user_id:', projectsIndexError);
    } else {
      console.log('✅ Index created on projects.user_id');
    }
    
    // Index on extension_files.project_id
    const filesIndexSql = `CREATE INDEX IF NOT EXISTS extension_files_project_id_idx ON public.extension_files (project_id);`;
    
    const { error: filesIndexError } = await executeSql(filesIndexSql);
    
    if (filesIndexError) {
      console.error('Error creating index on extension_files.project_id:', filesIndexError);
    } else {
      console.log('✅ Index created on extension_files.project_id');
    }
    
    // Index on project_settings.project_id
    const settingsIndexSql = `CREATE INDEX IF NOT EXISTS project_settings_project_id_idx ON public.project_settings (project_id);`;
    
    const { error: settingsIndexError } = await executeSql(settingsIndexSql);
    
    if (settingsIndexError) {
      console.error('Error creating index on project_settings.project_id:', settingsIndexError);
    } else {
      console.log('✅ Index created on project_settings.project_id');
    }
    
    // Index on conversations.project_id
    const conversationsIndexSql = `CREATE INDEX IF NOT EXISTS conversations_project_id_idx ON public.conversations (project_id);`;
    
    const { error: conversationsIndexError } = await executeSql(conversationsIndexSql);
    
    if (conversationsIndexError) {
      console.error('Error creating index on conversations.project_id:', conversationsIndexError);
    } else {
      console.log('✅ Index created on conversations.project_id');
    }
    
    // Index on deployment_history.project_id
    const deploymentIndexSql = `CREATE INDEX IF NOT EXISTS deployment_history_project_id_idx ON public.deployment_history (project_id);`;
    
    const { error: deploymentIndexError } = await executeSql(deploymentIndexSql);
    
    if (deploymentIndexError) {
      console.error('Error creating index on deployment_history.project_id:', deploymentIndexError);
    } else {
      console.log('✅ Index created on deployment_history.project_id');
    }
    
    // Index on user_subscriptions.user_id
    const subscriptionsIndexSql = `CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON public.user_subscriptions (user_id);`;
    
    const { error: subscriptionsIndexError } = await executeSql(subscriptionsIndexSql);
    
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