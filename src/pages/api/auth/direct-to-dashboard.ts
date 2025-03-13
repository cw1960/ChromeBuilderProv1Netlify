import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin, isDevelopment } from '@/lib/supabase';

/**
 * API route to handle redirecting users to the dashboard
 * This consolidates functionality from multiple redirection files
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get user ID from session cookie or query parameter
    const userId = req.query.userId as string;
    
    // If we have a user ID and supabaseAdmin is available, update their metadata
    if (userId && supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('users')
          .update({ 
            onboarding_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        console.log(`Direct-to-dashboard - Updated onboarding status for user: ${userId}`);
      } catch (error) {
        console.error('Direct-to-dashboard - Error updating user metadata:', error);
        // Continue with redirection even if update fails
      }
    } else if (userId && !supabaseAdmin) {
      console.log('Direct-to-dashboard - Skipping user update: Supabase admin client not available');
    }
    
    // Set cookies to bypass middleware checks
    res.setHeader('Set-Cookie', [
      `bypass_middleware=true; Path=/; Max-Age=3600`,
    ]);
    
    // Get the redirect URL from query parameters or default to dashboard
    const redirectUrl = (req.query.redirectUrl as string) || '/dashboard';
    console.log(`Direct-to-dashboard - Redirecting to: ${redirectUrl}`);
    
    // Redirect using both meta refresh and JavaScript for reliability
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="0;url=${redirectUrl}" />
          <title>Redirecting...</title>
        </head>
        <body>
          <p>Redirecting to dashboard...</p>
          <script>
            window.location.href = "${redirectUrl}";
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Direct-to-dashboard - Error:', error);
    
    // Even if there's an error, try to redirect to dashboard
    res.redirect(307, '/dashboard');
  }
} 