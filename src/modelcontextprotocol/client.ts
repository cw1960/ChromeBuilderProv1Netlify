interface ModelContextClientOptions {
  baseUrl: string;
  fetch?: typeof fetch;
}

export class ModelContextClient {
  private baseUrl: string;
  private fetchImpl: typeof fetch;

  constructor(options: ModelContextClientOptions) {
    this.baseUrl = options.baseUrl.endsWith('/') 
      ? options.baseUrl.slice(0, -1) 
      : options.baseUrl;
    
    this.fetchImpl = options.fetch || globalThis.fetch;
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const response = await this.fetchImpl(`${this.baseUrl}/api/contexts/${encodeURIComponent(key)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to get context: ${error.error || 'Unknown error'}`);
      }

      return await response.json() as T;
    } catch (err) {
      console.error(`Error getting context for key ${key}:`, err);
      throw err;
    }
  }

  async set<T = any>(key: string, value: T): Promise<void> {
    try {
      const response = await this.fetchImpl(`${this.baseUrl}/api/contexts/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(value),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to set context: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(`Error setting context for key ${key}:`, err);
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const response = await this.fetchImpl(`${this.baseUrl}/api/contexts/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to delete context: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(`Error deleting context for key ${key}:`, err);
      throw err;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.fetchImpl(`${this.baseUrl}/health`, {
        method: 'GET',
      });
      
      return response.ok;
    } catch (err) {
      console.error('Health check failed:', err);
      return false;
    }
  }
}

// Convenience function to create a client
export function createModelContextClient(options: ModelContextClientOptions): ModelContextClient {
  return new ModelContextClient(options);
}