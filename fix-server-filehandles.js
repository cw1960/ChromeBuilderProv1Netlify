/**
 * Fix for the "too many open files" error in server.js
 * This script modifies the server.js file to increase the file handle limit
 */
const fs = require('fs');
const path = require('path');

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

console.log('✅ Server file updated with fix for "too many open files" error.');
console.log('Note: You may need to install the "posix" package with: npm install posix --save');

// Check if posix is installed
try {
  require.resolve('posix');
  console.log('✅ "posix" package is already installed.');
} catch (error) {
  console.log('❌ "posix" package is not installed.');
  console.log('Please run: npm install posix --save');
} 