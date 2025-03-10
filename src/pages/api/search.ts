import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { webSearch, searchChromeExtensionDocs, searchCodeExamples } from '@/lib/search-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check if the user is authenticated
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'You must be signed in to use this API.' });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  // Extract query parameters
  const { q, type, count, offset, freshness } = req.query;
  
  // Validate required parameters
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  // Set up search options
  const options = {
    count: count ? parseInt(count as string, 10) : undefined,
    offset: offset ? parseInt(offset as string, 10) : undefined,
    freshness: freshness as 'day' | 'week' | 'month' | undefined,
    textFormat: 'html' as const,
  };

  try {
    let results;
    
    // Determine which search type to use
    switch (type) {
      case 'docs':
        results = await searchChromeExtensionDocs(q);
        break;
      case 'code':
        results = await searchCodeExamples(q);
        break;
      default:
        // Default to a standard web search
        results = await webSearch(q, options);
    }
    
    return res.status(200).json({ results });
  } catch (error) {
    console.error('Search API error:', error);
    return res.status(500).json({ 
      error: 'Failed to perform search',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}