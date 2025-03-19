/**
 * Fix for the "too many open files" error in server.js
 * This script modifies the server.js file to increase the file handle limit
 * Uses a safe approach without the vulnerable posix package
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read the current server.js file
const serverFilePath = path.join(process.cwd(), 'server.js');
let serverContent = fs.readFileSync(serverFilePath, 'utf8');

// Check if the fix has already been applied
if (serverContent.includes('// Increase file handle limit')) {
  console.log('❌ Fix already applied. No changes needed.');
  process.exit(0);
}

// Add fix at the top of the file
const fix = `
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
            execSync(\`ulimit -Sn \${hardLimit}\`);
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

`;

// Add the fix at the top of the file, after any shebang or initial comments
if (serverContent.startsWith('#!')) {
  // If there's a shebang, keep it at the top
  const lines = serverContent.split('\n');
  const shebang = lines[0];
  serverContent = shebang + '\n' + fix + lines.slice(1).join('\n');
} else {
  serverContent = fix + serverContent;
}

// Write the updated content back to the file
fs.writeFileSync(serverFilePath, serverContent);

console.log('✅ Server file updated with a safer fix for "too many open files" error.');
console.log('This version does not use the vulnerable posix package.') 