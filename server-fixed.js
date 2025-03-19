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
let PORT = process.env.PORT || 3336; // Default to 3336 instead of 3335

// Check for --port argument
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && i + 1 < args.length) {
    PORT = parseInt(args[i + 1], 10);
    break;
  }
}

// Ensure we're not using port 3335 which seems to cause conflicts
if (PORT === 3335) {
  console.log('Port 3335 is known to cause conflicts. Using port 3336 instead.');
  PORT = 3336;
}

console.log(`Starting server on port ${PORT}`);

// Create a .env.local file to ensure the port is set correctly
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

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}); 