import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { conversationId, messages } = req.body;

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    // Get the first user message to generate a title
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage) {
      return res.status(400).json({ error: 'No user message found' });
    }

    // Generate a title based on the first user message
    const title = generateTitle(firstUserMessage.content);

    // Update the conversation title in the database
    const { error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', conversationId);

    if (error) {
      console.error('Error updating conversation title:', error);
      return res.status(500).json({ error: 'Failed to update conversation title' });
    }

    return res.status(200).json({ title });
  } catch (error) {
    console.error('Error generating conversation title:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Function to generate a title from the first user message
function generateTitle(message: string): string {
  // Truncate and clean the message to create a title
  const maxLength = 50;
  
  // Remove code blocks
  let cleanMessage = message.replace(/```[\s\S]*?```/g, '');
  
  // Remove markdown formatting
  cleanMessage = cleanMessage.replace(/[*_~`#]/g, '');
  
  // Get the first sentence or part of it
  let title = cleanMessage.split(/[.!?]/)[0].trim();
  
  // Truncate if too long
  if (title.length > maxLength) {
    title = title.substring(0, maxLength).trim() + '...';
  }
  
  // If title is empty or just whitespace, use a default
  if (!title || title.length < 5) {
    return 'New Conversation';
  }
  
  return title;
}