/**
 * port-check.js
 * 
 * This script checks for and kills any processes using port 3335 or 3336
 * to prevent port conflicts when starting the application.
 * 
 * It's designed to be run automatically before the server starts.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to find and kill processes using a specific port
function killProcessOnPort(port) {
  try {
    // Get the process ID using the port
    const cmd = process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} | grep LISTEN`;
    
    const output = execSync(cmd, { encoding: 'utf8' });
    console.log(`Processes using port ${port}:`);
    console.log(output);
    
    // Extract PID and kill the process
    if (output) {
      let pid;
      if (process.platform === 'win32') {
        pid = output.trim().split(/\s+/).pop();
      } else {
        const match = output.match(/\S+\s+(\d+)/);
        pid = match ? match[1] : null;
      }
      
      if (pid) {
        console.log(`Killing process ${pid} using port ${port}`);
        execSync(process.platform === 'win32' ? `taskkill /F /PID ${pid}` : `kill ${pid}`);
        console.log(`Process ${pid} killed successfully`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.log(`No processes found using port ${port}`);
    return false;
  }
}

// Function to check if a port is in use
function isPortInUse(port) {
  try {
    const cmd = process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} | grep LISTEN`;
    
    execSync(cmd, { encoding: 'utf8' });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to update .env.local file with correct port
function updateEnvFile(port) {
  try {
    const envPath = path.join(__dirname, '.env.local');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update NEXTAUTH_URL
      if (envContent.includes('NEXTAUTH_URL=')) {
        envContent = envContent.replace(/NEXTAUTH_URL=http:\/\/localhost:\d+/, `NEXTAUTH_URL=http://localhost:${port}`);
      } else {
        envContent += `\nNEXTAUTH_URL=http://localhost:${port}`;
      }
      
      // Update NEXT_PUBLIC_SITE_URL
      if (envContent.includes('NEXT_PUBLIC_SITE_URL=')) {
        envContent = envContent.replace(/NEXT_PUBLIC_SITE_URL=http:\/\/localhost:\d+/, `NEXT_PUBLIC_SITE_URL=http://localhost:${port}`);
      } else {
        envContent += `\nNEXT_PUBLIC_SITE_URL=http://localhost:${port}`;
      }
      
      // Update PORT
      if (envContent.includes('PORT=')) {
        envContent = envContent.replace(/PORT=\d+/, `PORT=${port}`);
      } else {
        envContent += `\nPORT=${port}`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log(`.env.local updated with port ${port}`);
    }
  } catch (error) {
    console.error('Error updating .env.local file:', error);
  }
}

// Main execution
console.log('Running port conflict check...');

// Always check and kill processes on port 3335 to prevent conflicts
const port3335InUse = isPortInUse(3335);
if (port3335InUse) {
  console.log('WARNING: Port 3335 is in use. This port is known to cause conflicts.');
  const killed = killProcessOnPort(3335);
  if (killed) {
    console.log('Successfully killed process on port 3335');
  } else {
    console.log('Failed to kill process on port 3335. You may need to manually kill it.');
  }
}

// Check if port 3336 is in use
const port3336InUse = isPortInUse(3336);
if (port3336InUse) {
  console.log('Port 3336 is already in use. Attempting to kill the process...');
  const killed = killProcessOnPort(3336);
  if (killed) {
    console.log('Successfully killed process on port 3336');
  } else {
    console.log('Failed to kill process on port 3336. You may need to manually kill it.');
  }
}

// Update .env.local file to ensure correct port is used
updateEnvFile(3336);

console.log('Port conflict check completed.');
console.log('The application will use port 3336.');
console.log('If you still encounter port conflicts, run: npm run fix-ports');

// Exit with success code
process.exit(0); 