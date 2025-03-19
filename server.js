
// Increase file handle limit
const os = require('os');
try {
  // Only try to set limits on Unix-like systems
  if (os.platform() !== 'win32') {
    // Require the posix module only on Unix-like systems
    const posix = require('posix');
    
    // Get current limits
    const oldLimits = posix.getrlimit('nofile');
    console.log('Current file handle limits:', oldLimits);
    
    // Set new limits - increase the soft limit to the hard limit
    if (oldLimits.soft < oldLimits.hard) {
      posix.setrlimit('nofile', { soft: oldLimits.hard, hard: oldLimits.hard });
      const newLimits = posix.getrlimit('nofile');
      console.log('New file handle limits:', newLimits);
    }
  }
} catch (error) {
  console.warn('Unable to set file handle limits:', error.message);
  console.warn('This is not critical but might affect server performance under heavy load.');
}

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Parse command line arguments for port
const args = process.argv.slice(2);
let PORT = process.env.PORT || 3336;

// Check for --port argument
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && i + 1 < args.length) {
    PORT = parseInt(args[i + 1], 10);
    break;
  }
}

// CRITICAL: Ensure we're not using port 3335 which causes conflicts
if (PORT === 3335) {
  console.log('Port 3335 is known to cause conflicts. Using port 3336 instead.');
  PORT = 3336;
}

// Create or update .env.local file to ensure PORT is set correctly
try {
  const envPath = path.join(__dirname, '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    // Replace or add PORT variable
    if (envContent.includes('PORT=')) {
      envContent = envContent.replace(/PORT=\d+/, `PORT=${PORT}`);
    } else {
      envContent += `\nPORT=${PORT}`;
    }
  } else {
    envContent = `PORT=${PORT}`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`.env.local updated with PORT=${PORT}`);
} catch (error) {
  console.error('Error updating .env.local file:', error);
}

console.log(`Starting server on port ${PORT}`);

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}); 