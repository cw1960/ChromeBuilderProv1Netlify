import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow this in development mode
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Forbidden in production mode' });
  }

  // Set cookies to bypass middleware checks
  res.setHeader('Set-Cookie', [
    `bypass_middleware=true; Path=/; Max-Age=3600`,
  ]);

  console.log('Direct-to-dashboard - Redirecting to: /dashboard');
  
  // Redirect to dashboard
  res.redirect(307, '/dashboard');
} 