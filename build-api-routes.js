const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting API routes build process...');

// Create a temporary .env.local file with NODE_ENV=development
const envPath = path.join(__dirname, '.env.local');
let originalEnvContent = '';

if (fs.existsSync(envPath)) {
  originalEnvContent = fs.readFileSync(envPath, 'utf8');
}

// Add or update NODE_ENV in .env.local
const envContent = originalEnvContent + '\nNODE_ENV=development\n';
fs.writeFileSync(envPath, envContent);

try {
  // Run the build command with specific focus on API routes
  console.log('Building API routes...');
  execSync('npx next build', { stdio: 'inherit' });
  console.log('API routes build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
} finally {
  // Restore original .env.local
  fs.writeFileSync(envPath, originalEnvContent);
  console.log('Restored original .env.local file');
}

console.log('API routes build process completed.');

// Now start the server in development mode
console.log('Starting server in development mode...');
console.log('Use Ctrl+C to stop the server');

// Use a different port to avoid conflicts
const PORT = 3336;
process.env.PORT = PORT;
process.env.NODE_ENV = 'development';

// Start the server
require('./server.js'); 