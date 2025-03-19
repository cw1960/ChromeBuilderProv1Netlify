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
      }
    }
  } catch (error) {
    console.log(`No processes found using port ${port}`);
  }
}

// Kill any processes using port 3335 or 3336
console.log('Checking for processes using port 3335...');
killProcessOnPort(3335);

console.log('Checking for processes using port 3336...');
killProcessOnPort(3336);

// Set environment variables to avoid using port 3335
process.env.PORT = '3336';

// Create or update .env.local file
const envPath = path.join(__dirname, '.env.local');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  // Replace or add PORT variable
  if (envContent.includes('PORT=')) {
    envContent = envContent.replace(/PORT=\d+/, 'PORT=3336');
  } else {
    envContent += '\nPORT=3336';
  }
} else {
  envContent = 'PORT=3336';
}

fs.writeFileSync(envPath, envContent);
console.log('.env.local updated with PORT=3336');

// Start the application using the fixed server
console.log('Starting application with fixed server...');
try {
  execSync('node server-fixed.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Error starting the application:', error);
} 