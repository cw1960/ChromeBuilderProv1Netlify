const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// Kill any processes using port 3335
killProcessOnPort(3335);

// Check if port 3336 is in use and kill if necessary
if (isPortInUse(3336)) {
  killProcessOnPort(3336);
}

console.log('Port conflicts resolved. You can now start the application with:');
console.log('npm run dev'); 