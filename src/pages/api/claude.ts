import { NextApiRequest, NextApiResponse } from 'next';

interface Message {
  role: string;
  content: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { messages, apiKey } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }
  
  try {
    console.log('Received messages:', JSON.stringify(messages).slice(0, 200) + '...');
    
    // Extract system message if present
    const systemMessage = messages.find((msg: Message) => msg.role === 'system')?.content || '';
    
    // Filter out system messages and format the rest for Claude API
    const formattedMessages = messages
      .filter((msg: Message) => msg.role !== 'system')
      .map((msg: Message) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));
    
    console.log('Calling Claude API with formatted messages:', JSON.stringify(formattedMessages).slice(0, 200) + '...');
    console.log('System message:', systemMessage.slice(0, 100) + '...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        messages: formattedMessages,
        system: systemMessage,
        max_tokens: 4000
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Claude API error: ${response.status}`,
        details: errorText
      });
    }
    
    const data = await response.json();
    console.log('Claude API response:', JSON.stringify(data).slice(0, 200) + '...');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return res.status(500).json({ error: 'Failed to call Claude API', details: String(error) });
  }
} 