import { Pool, PoolClient } from 'pg';
import { createServer } from 'http';
import { ModelContextProtocolServer } from './server';

interface PostgresStoreOptions {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  poolSize?: number;
  tableName?: string;
}

export class PostgresStore {
  private pool: Pool;
  private tableName: string;
  
  constructor(options: PostgresStoreOptions = {}) {
    this.tableName = options.tableName || 'model_context_store';
    
    this.pool = new Pool({
      connectionString: options.connectionString,
      host: options.host,
      port: options.port,
      database: options.database,
      user: options.user,
      password: options.password,
      ssl: options.ssl,
      max: options.poolSize || 20,
    });
    
    this.initialize().catch(err => {
      console.error('Failed to initialize PostgresStore:', err);
    });
  }
  
  private async initialize(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create index on key for faster lookups
      await client.query(`
        CREATE INDEX IF NOT EXISTS ${this.tableName}_key_idx ON ${this.tableName} (key)
      `);
      
      console.log(`PostgresStore initialized with table: ${this.tableName}`);
    } catch (err) {
      console.error('Error initializing database:', err);
      throw err;
    } finally {
      client.release();
    }
  }
  
  async get(key: string): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT value FROM ${this.tableName} WHERE key = $1`,
        [key]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0].value;
    } catch (err) {
      console.error(`Error getting key ${key}:`, err);
      throw err;
    } finally {
      client.release();
    }
  }
  
  async set(key: string, value: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `
        INSERT INTO ${this.tableName} (key, value, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (key)
        DO UPDATE SET
          value = $2,
          updated_at = CURRENT_TIMESTAMP
        `,
        [key, value]
      );
    } catch (err) {
      console.error(`Error setting key ${key}:`, err);
      throw err;
    } finally {
      client.release();
    }
  }
  
  async delete(key: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `DELETE FROM ${this.tableName} WHERE key = $1`,
        [key]
      );
    } catch (err) {
      console.error(`Error deleting key ${key}:`, err);
      throw err;
    } finally {
      client.release();
    }
  }
  
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
  
  async close(): Promise<void> {
    await this.pool.end();
  }
}

export function createPostgresServer(options: PostgresStoreOptions & { port?: number } = {}) {
  const store = new PostgresStore(options);
  const server = new ModelContextProtocolServer(store);
  
  const httpServer = createServer(server.handleRequest.bind(server));
  const port = options.port || 3001;
  
  httpServer.listen(port, () => {
    console.log(`Model Context Protocol Server running on port ${port}`);
  });
  
  return {
    httpServer,
    store,
    server,
    close: async () => {
      return new Promise<void>((resolve, reject) => {
        httpServer.close(async (err) => {
          if (err) reject(err);
          await store.close();
          resolve();
        });
      });
    }
  };
}