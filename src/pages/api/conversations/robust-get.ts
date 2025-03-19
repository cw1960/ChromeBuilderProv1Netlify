import { NextApiRequest, NextApiResponse } from 'next';
import { ProjectManager } from '@/lib/project-manager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { conversationId } = req.query;

  if (!conversationId || typeof conversationId !== 'string') {
    return res.status(400).json({ message: 'Conversation ID is required' });
  }

  try {
    console.log(`Robust Get Conversation API: Fetching conversation: ${conversationId}`);
    
    // Get the project manager instance
    const projectManager = ProjectManager.getInstance();
    
    // Get the conversation
    const conversation = await projectManager.getConversation(conversationId);
    
    if (!conversation) {
      console.log(`Robust Get Conversation API: Conversation not found: ${conversationId}`);
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    console.log(`Robust Get Conversation API: Conversation found: ${conversationId}`);
    
    return res.status(200).json({
      message: 'Conversation retrieved successfully',
      conversation
    });
  } catch (error) {
    console.error('Robust Get Conversation API: Unexpected error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 