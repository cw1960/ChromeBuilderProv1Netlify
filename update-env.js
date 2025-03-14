// Script to update the .env.local file with the new Supabase credentials
const fs = require('fs');
const path = require('path');

// New Supabase credentials
const newCredentials = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://dfztfzxuplkzfggnzfwk.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmenRmenh1cGxremZnZ256ZndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4OTU0MDYsImV4cCI6MjA1NzQ3MTQwNn0.oaylUpDj-XZ6U662H4qIiaWfP379lf-hebqGvahrwyQ',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmenRmenh1cGxremZnZ256ZndrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTg5NTQwNiwiZXhwIjoyMDU3NDcxNDA2fQ.cOdTf_CljrekACqEacfFf10a6dg8KfaxqfB84NcdqDY'
};

// Path to .env.local file
const envFilePath = path.join(process.cwd(), '.env.local');

try {
  // Check if .env.local file exists
  if (fs.existsSync(envFilePath)) {
    console.log('Reading existing .env.local file...');
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    
    // Parse existing environment variables
    const envVars = {};
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      }
    });
    
    // Update with new Supabase credentials
    Object.keys(newCredentials).forEach(key => {
      envVars[key] = newCredentials[key];
    });
    
    // Convert back to string format
    const newEnvContent = Object.keys(envVars)
      .map(key => `${key}=${envVars[key]}`)
      .join('\n');
    
    // Write updated content back to .env.local
    fs.writeFileSync(envFilePath, newEnvContent);
    console.log('Updated .env.local file with new Supabase credentials.');
    
    // Display the updated credentials
    console.log('\nUpdated Supabase credentials:');
    Object.keys(newCredentials).forEach(key => {
      console.log(`${key}=${newCredentials[key]}`);
    });
  } else {
    console.log('.env.local file not found. Creating a new one...');
    
    // Create a new .env.local file with the Supabase credentials
    const newEnvContent = Object.keys(newCredentials)
      .map(key => `${key}=${newCredentials[key]}`)
      .join('\n');
    
    fs.writeFileSync(envFilePath, newEnvContent);
    console.log('Created new .env.local file with Supabase credentials.');
    
    // Display the new credentials
    console.log('\nNew Supabase credentials:');
    Object.keys(newCredentials).forEach(key => {
      console.log(`${key}=${newCredentials[key]}`);
    });
  }
  
  console.log('\nDone! The application is now configured to use the new Supabase database.');
} catch (error) {
  console.error('Error updating .env.local file:', error);
} 