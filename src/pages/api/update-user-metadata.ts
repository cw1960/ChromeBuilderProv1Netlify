import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
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
    const { userId, metadata, onboardingData } = req.body;

    if (!userId || !metadata || !onboardingData) {
      return res.status(400).json({ message: 'Missing required data' });
    }

    // Update user metadata
    const { error: metadataError } = await supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: metadata }
    );

    if (metadataError) {
      console.error('Error updating user metadata:', metadataError);
      return res.status(400).json({ message: metadataError.message });
    }

    // Update user profile data
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        first_name: onboardingData.first_name,
        dev_experience: onboardingData.dev_experience,
        onboarding_completed: true,
      });

    if (profileError) {
      console.error('Error updating profile data:', profileError);
      return res.status(400).json({ message: profileError.message });
    }

    return res.status(200).json({
      message: 'User data updated successfully',
      userId,
    });
  } catch (error: any) {
    console.error('Server error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 