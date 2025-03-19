const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Force port to be 3336 regardless of command line arguments or environment variables
const PORT = 3336;

// Kill any processes using ports 3335 and 3336
function killProcessOnPort(port) {
  try {
    console.log(`Checking for processes using port ${port}...`);
    
    // Different commands for different operating systems
    let command;
    if (process.platform === 'win32') {
      command = `netstat -ano | findstr :${port}`;
    } else {
      command = `lsof -i :${port} | grep LISTEN`;
    }
    
    const result = execSync(command, { encoding: 'utf8' });
    
    if (result) {
      console.log(`Found process using port ${port}:`);
      console.log(result);
      
      // Extract PID and kill the process
      let pid;
      if (process.platform === 'win32') {
        pid = result.trim().split(/\s+/).pop();
      } else {
        pid = result.trim().split(/\s+/)[1];
      }
      
      if (pid) {
        console.log(`Killing process with PID ${pid}...`);
        if (process.platform === 'win32') {
          execSync(`taskkill /F /PID ${pid}`);
        } else {
          execSync(`kill -9 ${pid}`);
        }
        console.log(`Process with PID ${pid} killed.`);
      }
    } else {
      console.log(`No process found using port ${port}.`);
    }
  } catch (error) {
    // If the command fails, it likely means no process is using the port
    console.log(`No process found using port ${port}.`);
  }
}

// Update .env.local to ensure all URLs and port configurations use port 3336
function updateEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add PORT variable
    if (envContent.includes('PORT=')) {
      envContent = envContent.replace(/PORT=\d+/g, `PORT=${PORT}`);
    } else {
      envContent += `\nPORT=${PORT}`;
    }
    
    // Update or add NEXTAUTH_URL variable
    if (envContent.includes('NEXTAUTH_URL=')) {
      envContent = envContent.replace(/NEXTAUTH_URL=http:\/\/localhost:\d+/g, `NEXTAUTH_URL=http://localhost:${PORT}`);
    } else {
      envContent += `\nNEXTAUTH_URL=http://localhost:${PORT}`;
    }
    
    // Update or add NEXT_PUBLIC_SITE_URL variable
    if (envContent.includes('NEXT_PUBLIC_SITE_URL=')) {
      envContent = envContent.replace(/NEXT_PUBLIC_SITE_URL=http:\/\/localhost:\d+/g, `NEXT_PUBLIC_SITE_URL=http://localhost:${PORT}`);
    } else {
      envContent += `\nNEXT_PUBLIC_SITE_URL=http://localhost:${PORT}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`.env.local updated to use port ${PORT}.`);
  } catch (error) {
    console.error('Error updating .env.local:', error);
  }
}

// Main function to start the server
async function startServer() {
  try {
    // Kill any processes using ports 3335 and 3336
    killProcessOnPort(3335);
    killProcessOnPort(3336);
    
    // Update .env.local
    updateEnvFile();
    
    // Set environment variables
    process.env.PORT = PORT.toString();
    process.env.NEXTAUTH_URL = `http://localhost:${PORT}`;
    process.env.NEXT_PUBLIC_SITE_URL = `http://localhost:${PORT}`;
    
    // Create Next.js app
    const dev = process.env.NODE_ENV !== 'production';
    const app = next({ dev });
    const handle = app.getRequestHandler();
    
    await app.prepare();
    
    // Create HTTP server
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });
    
    // Start server on port 3336 only
    server.listen(PORT, (err) => {
      if (err) throw err;
      console.log(`Starting server on port ${PORT}`);
      console.log(`> Ready on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the server
startServer(); 