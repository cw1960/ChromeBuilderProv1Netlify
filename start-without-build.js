const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Force development mode to avoid prerendering
process.env.NODE_ENV = 'development';

const app = next({ dev: true });
const handle = app.getRequestHandler();

// Use port 3335 to avoid conflicts with existing processes
const PORT = process.env.PORT || 3335;

console.log('Starting server without build...');
console.log(`Server will run on http://localhost:${PORT}`);

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}); 