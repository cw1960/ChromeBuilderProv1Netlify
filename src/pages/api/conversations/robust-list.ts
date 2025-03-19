import { NextApiRequest, NextApiResponse } from 'next';
import { ProjectManager } from '@/lib/project-manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { projectId } = req.query;

  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({ message: 'Project ID is required' });
  }

  try {
    console.log(`Robust List Conversations API: Fetching conversations for project: ${projectId}`);
    
    // Get the project manager instance
    const projectManager = ProjectManager.getInstance();
    
    // Get the conversations
    const conversations = await projectManager.getProjectConversations(projectId);
    
    console.log(`Robust List Conversations API: Found ${conversations.length} conversations for project ${projectId}`);
    
    return res.status(200).json({
      message: 'Conversations retrieved successfully',
      conversations
    });
  } catch (error) {
    console.error('Robust List Conversations API: Unexpected error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 