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
    case 'PUT':
      return handlePut(req, res, session);
    case 'DELETE':
      return handleDelete(req, res, session);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get a single project setting
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any
) {
  try {
    const { key, projectId } = req.query;

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

    // Get setting
    const { data: setting, error } = await supabaseAdmin
      .from('project_settings')
      .select('*')
      .eq('project_id', projectId)
      .eq('key', key)
      .single();

    if (error || !setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    return res.status(200).json(setting);
  } catch (error: any) {
    console.error('Error in project setting GET:', error);
    return res.status(500).json({ message: error.message });
  }
}

// Update a project setting
async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any
) {
  try {
    const { key, projectId } = req.query;
    const { value } = req.body;

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

    // Update setting
    const { data: setting, error } = await supabaseAdmin
      .from('project_settings')
      .update({ value })
      .eq('project_id', projectId)
      .eq('key', key)
      .select()
      .single();

    if (error) {
      console.error('Error updating project setting:', error);
      return res.status(500).json({ message: error.message });
    }

    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    return res.status(200).json(setting);
  } catch (error: any) {
    console.error('Error in project setting PUT:', error);
    return res.status(500).json({ message: error.message });
  }
}

// Delete a project setting
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  session: any
) {
  try {
    const { key, projectId } = req.query;

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

    // Delete setting
    const { error } = await supabaseAdmin
      .from('project_settings')
      .delete()
      .eq('project_id', projectId)
      .eq('key', key);

    if (error) {
      console.error('Error deleting project setting:', error);
      return res.status(500).json({ message: error.message });
    }

    return res.status(204).end();
  } catch (error: any) {
    console.error('Error in project setting DELETE:', error);
    return res.status(500).json({ message: error.message });
  }
} 