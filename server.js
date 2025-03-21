// Increase file handle limit in a safe way
const os = require('os');
const { execSync } = require('child_process');

try {
  // Only try to set limits on Unix-like systems (macOS, Linux)
  if (os.platform() !== 'win32') {
    // Use the OS's native commands instead of vulnerable posix package
    if (os.platform() === 'darwin') {
      // macOS: Get and set limits using launchctl
      try {
        // Check current limits 
        const currentLimits = execSync('launchctl limit maxfiles').toString().trim();
        console.log('Current file handle limits:', currentLimits);
        
        // Set higher limits if needed
        // This will require sudo permission in terminal, so we just log the advice
        if (currentLimits.includes('256') || currentLimits.includes('1024')) {
          console.log('Consider increasing file handle limits with:');
          console.log('sudo launchctl limit maxfiles 65536 200000');
        }
      } catch (err) {
        console.warn('Unable to check file handle limits:', err.message);
      }
    } else if (os.platform() === 'linux') {
      // Linux: Get and set limits using ulimit
      try {
        // Check current limits
        const softLimit = execSync('ulimit -Sn').toString().trim();
        const hardLimit = execSync('ulimit -Hn').toString().trim();
        console.log('Current file handle limits - Soft:', softLimit, 'Hard:', hardLimit);
        
        // Try to increase soft limit to hard limit
        if (parseInt(softLimit) < parseInt(hardLimit)) {
          try {
            execSync(`ulimit -Sn ${hardLimit}`);
            const newSoftLimit = execSync('ulimit -Sn').toString().trim();
            console.log('New soft limit:', newSoftLimit);
          } catch (limitErr) {
            console.warn('Unable to set file handle limits. You may need to:');
            console.warn('1. Add "ulimit -n <number>" to your startup script');
            console.warn('2. Edit /etc/security/limits.conf to add higher limits');
          }
        }
      } catch (err) {
        console.warn('Unable to check file handle limits:', err.message);
      }
    }
  }
} catch (error) {
  console.warn('Unable to adjust file handle limits:', error.message);
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