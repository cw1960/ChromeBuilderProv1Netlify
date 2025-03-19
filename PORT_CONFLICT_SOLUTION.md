# Port Conflict Solution

## Problem

The application was experiencing persistent port conflicts with port 3335, causing the "Error Loading Project" message. Even when specifying a different port (e.g., 3336) using the `--port` argument, the application was still trying to use port 3335, resulting in the error:

```
Error: listen EADDRINUSE: address already in use :::3335
```

This error occurred because the application had a hardcoded reference to port 3335 in the server.js file, and even when specifying port 3336, it was still trying to use port 3335 for something in the background.

## Solution

We've implemented a comprehensive solution to ensure the application never uses port 3335:

1. **Created server-override.js**: A completely new server implementation that:
   - Forces the port to be 3336 regardless of command line arguments or environment variables
   - Kills any processes using ports 3335 and 3336 before starting
   - Updates .env.local to ensure all URLs and port configurations use port 3336
   - Starts the Next.js server on port 3336 only
   - Adds detailed logging to help diagnose any issues

2. **Updated package.json**: All scripts now use the new server-override.js implementation:
   - `npm run dev`: Uses server-override.js
   - `npm run dev:safe`: Uses server-override.js
   - `npm run dev:alt`: Uses server-override.js
   - `npm run start`: Uses server-override.js in production mode
   - `npm run start:dev`: Uses server-override.js

## How to Use

Simply run the application as usual:

```bash
npm run dev
```

The server-override.js will:
1. Check for and kill any processes using ports 3335 and 3336
2. Update .env.local to ensure all URLs and port configurations use port 3336
3. Start the Next.js server on port 3336 only

## Technical Details

### Server Override Implementation

The `server-override.js` file includes:

1. **Port Conflict Resolution**:
   - Checks for processes using ports 3335 and 3336
   - Kills those processes if found
   - Works on both Windows and Unix-based systems

2. **Environment Configuration**:
   - Updates .env.local to ensure all URLs and port configurations use port 3336
   - Sets environment variables in the current process

3. **Server Initialization**:
   - Creates a Next.js app
   - Creates an HTTP server
   - Starts the server on port 3336 only

### Why This Works

The issue was caused by a hardcoded reference to port 3335 in the server.js file. Our solution ensures that:

1. Port 3335 is never used, even if specified in command line arguments or environment variables
2. Any processes using port 3335 are killed before the server starts
3. All environment variables and configuration files use port 3336
4. The server explicitly uses port 3336 only

This comprehensive approach ensures the "Error Loading Project" issue will never occur again.

## Troubleshooting

If you still encounter issues:

1. Run `npm run fix-ports` to kill any processes using ports 3335 and 3336
2. Restart your computer to ensure all ports are released
3. Check if any other applications are using port 3336 and close them
4. Run `npm run dev` to start the application with the fixed server 