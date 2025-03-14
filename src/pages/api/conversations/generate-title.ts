import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get the session
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { messages, apiKey: clientApiKey } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Valid messages array is required' });
    }

    // Get the Claude API key from environment variables or client-side storage
    let apiKey = process.env.CLAUDE_API_KEY || clientApiKey;
    
    if (!apiKey) {
      console.error('Generate Title API: No Claude API key found');
      // Fallback to a generic title if no API key is available
      return res.status(200).json({ 
        title: `Conversation ${new Date().toLocaleString()}` 
      });
    }

    // Prepare the conversation content for the AI
    // We'll use only the first few messages to keep the request small
    const messagesToUse = messages.slice(0, Math.min(5, messages.length));
    
    // Format the messages for Claude
    const conversationContent = messagesToUse
      .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content.substring(0, 500)}`)
      .join('\n\n');

    // Prepare the prompt for Claude
    const prompt = `
Human: Based on the following conversation, generate a short, descriptive title (maximum 6 words) that captures the main topic or purpose:

${conversationContent}

Please respond with ONLY the title, nothing else.
`;

    try {
      // Call the Anthropic API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 30,
          temperature: 0.7,
          system: "You generate short, descriptive titles (maximum 6 words) based on conversation content. Respond with ONLY the title, nothing else.",
          messages: [
            {
              role: 'user',
              content: `Generate a short, descriptive title (maximum 6 words) for this conversation:\n\n${conversationContent}`
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Anthropic API error:', errorData);
        // Fallback to a generic title
        return res.status(200).json({ 
          title: `Conversation ${new Date().toLocaleString()}` 
        });
      }

      const data = await response.json();
      const title = data.content[0].text.trim();

      return res.status(200).json({ title });
    } catch (apiError) {
      console.error('Error calling Anthropic API:', apiError);
      // Fallback to a generic title
      return res.status(200).json({ 
        title: `Conversation ${new Date().toLocaleString()}` 
      });
    }
  } catch (error) {
    console.error('Error in generate-title API:', error);
    return res.status(500).json({ 
      message: 'Internal Server Error',
      title: `Conversation ${new Date().toLocaleString()}`
    });
  }
}