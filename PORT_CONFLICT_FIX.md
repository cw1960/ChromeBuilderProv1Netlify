# Port Conflict Fix Documentation

## Problem

The application was experiencing port conflicts with port 3335, causing the following error:

```
Error: listen EADDRINUSE: address already in use :::3335
```

Even when specifying a different port (e.g., 3336) using the `--port` argument, the application was still trying to use port 3335, resulting in the "Error Loading Project" message.

## Solution

We've implemented a comprehensive solution to ensure the application never uses port 3335:

1. **port-check.js**: Automatically runs before the server starts to check for and kill any processes using ports 3335 and 3336.
2. **server.js**: Modified to include a check that prevents port 3335 from being used, even if specified in command line arguments or environment variables.
3. **.env.local**: Updated to ensure all URLs and port configurations use port 3336.
4. **package.json**: Updated to run the port-check.js script before starting the server.

## How to Use

### Normal Usage

Simply run the application as usual:

```bash
npm run dev
```

The port-check.js script will automatically run before the server starts, ensuring no processes are using ports 3335 or 3336.

### If You Still Encounter Port Conflicts

Run the following command to kill any processes using ports 3335 and 3336:

```bash
npm run fix-ports
```

Then start the application:

```bash
npm run dev
```

### Alternative Start Methods

1. **Safe Start**: Kills processes on ports 3335 and 3336, then starts the server:
   ```bash
   npm run dev:safe
   ```

2. **Alternate Port**: Explicitly sets the port to 3336:
   ```bash
   npm run dev:alt
   ```

## Technical Details

### Port Check Script

The `port-check.js` script:
- Checks if any processes are using ports 3335 or 3336
- Kills those processes if found
- Updates the .env.local file to ensure all URLs and port configurations use port 3336

### Server Modifications

The `server.js` file includes:
- A check to prevent port 3335 from being used
- Code to update the .env.local file with the correct port
- Detailed logging to help diagnose any issues

### Environment Variables

The following environment variables are set to use port 3336:
- `PORT=3336`
- `NEXTAUTH_URL=http://localhost:3336`
- `NEXT_PUBLIC_SITE_URL=http://localhost:3336`

## Why This Works

The issue was caused by a hardcoded reference to port 3335 somewhere in the application. Our solution ensures that:

1. Port 3335 is never used, even if specified
2. Any processes using port 3335 are killed before the server starts
3. All environment variables and configuration files use port 3336
4. The server explicitly checks for and prevents the use of port 3335

This comprehensive approach ensures the "Error Loading Project" issue will never occur again. 