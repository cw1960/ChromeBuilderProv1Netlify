import { NextApiRequest, NextApiResponse } from 'next';
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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Create user in Supabase
    const { data: user, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for now
    });

    if (signUpError) {
      console.error('Signup error:', signUpError);
      return res.status(400).json({ message: signUpError.message });
    }

    if (!user) {
      return res.status(500).json({ message: 'Failed to create user' });
    }

    // Return success
    return res.status(200).json({
      message: 'Account created successfully',
      user: {
        id: user.user.id,
        email: user.user.email,
      },
    });
  } catch (error: any) {
    console.error('Server error during signup:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 