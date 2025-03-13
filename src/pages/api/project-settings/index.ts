import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, session);
    case 'POST':
      return handlePost(req, res, session);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all settings for a project
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any
) {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', session.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get settings
    const { data: settings, error } = await supabaseAdmin
      .from('project_settings')
      .select('*')
      .eq('project_id', projectId)
      .order('key');

    if (error) {
      console.error('Error fetching project settings:', error);
      return res.status(500).json({ message: error.message });
    }

    return res.status(200).json(settings);
  } catch (error: any) {
    console.error('Error in project settings GET:', error);
    return res.status(500).json({ message: error.message });
  }
}

// Create a new project setting
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any
) {
  try {
    const { projectId, key, value } = req.body;

    if (!projectId || !key) {
      return res.status(400).json({ message: 'Project ID and key are required' });
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', session.user.id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if setting already exists
    const { data: existing } = await supabaseAdmin
      .from('project_settings')
      .select('id')
      .eq('project_id', projectId)
      .eq('key', key)
      .single();

    if (existing) {
      return res.status(409).json({ message: 'Setting already exists' });
    }

    // Create setting
    const { data: setting, error } = await supabaseAdmin
      .from('project_settings')
      .insert({
        project_id: projectId,
        key,
        value: value || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project setting:', error);
      return res.status(500).json({ message: error.message });
    }

    return res.status(201).json(setting);
  } catch (error: any) {
    console.error('Error in project settings POST:', error);
    return res.status(500).json({ message: error.message });
  }
} 