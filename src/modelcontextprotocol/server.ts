import { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';

interface Store {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
}

export class ModelContextProtocolServer {
  private store: Store;

  constructor(store: Store) {
    this.store = store;
  }

  async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const path = url.pathname;
      
      // Handle health check
      if (path === '/health' && req.method === 'GET') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'ok' }));
        return;
      }

      // All other routes should start with /api
      if (!path.startsWith('/api/')) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }

      // Extract key from path (format: /api/contexts/{key})
      const matches = path.match(/^\/api\/contexts\/(.+)$/);
      if (!matches) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid API path' }));
        return;
      }

      const key = matches[1];

      switch (req.method) {
        case 'GET':
          await this.handleGet(key, res);
          break;
        case 'PUT':
        case 'POST':
          await this.handleSet(key, req, res);
          break;
        case 'DELETE':
          await this.handleDelete(key, res);
          break;
        default:
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
      }
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }

  private async handleGet(key: string, res: ServerResponse): Promise<void> {
    try {
      const value = await this.store.get(key);
      
      if (value === null) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Key not found' }));
        return;
      }
      
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(value));
    } catch (err) {
      console.error(`Error getting key ${key}:`, err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Failed to retrieve data' }));
    }
  }

  private async handleSet(key: string, req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const body = await this.readBody(req);
      const data = JSON.parse(body);
      
      await this.store.set(key, data);
      
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      console.error(`Error setting key ${key}:`, err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Failed to store data' }));
    }
  }

  private async handleDelete(key: string, res: ServerResponse): Promise<void> {
    try {
      await this.store.delete(key);
      
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      console.error(`Error deleting key ${key}:`, err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Failed to delete data' }));
    }
  }

  private readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      req.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      req.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        resolve(body);
      });
      
      req.on('error', (err) => {
        reject(err);
      });
    });
  }
}