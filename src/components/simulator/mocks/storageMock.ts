import { StorageMock, StorageArea, StorageChange } from './types';

type StorageListener = (changes: { [key: string]: StorageChange }, areaName: string) => void;

export class ChromeStorageMock implements StorageMock {
  private localData: Record<string, any> = {};
  private syncData: Record<string, any> = {};
  private sessionData: Record<string, any> = {};
  private storageListeners: StorageListener[] = [];
  private logger: (type: 'info' | 'error' | 'warn', message: string) => void;

  constructor(logger: (type: 'info' | 'error' | 'warn', message: string) => void) {
    this.logger = logger;
  }

  // Create a storage area implementation (local, sync, session)
  private createStorageArea(areaName: string, data: Record<string, any>): StorageArea {
    return {
      get: (keys, callback) => {
        this.logger('info', `chrome.storage.${areaName}.get called with: ${keys ? JSON.stringify(keys) : 'null'}`);
        
        let result: Record<string, any> = {};
        
        if (!keys) {
          // Return all data if no keys specified
          callback({ ...data });
          return;
        }
        
        if (typeof keys === 'string') {
          // Single key
          result[keys] = data[keys];
        } else if (Array.isArray(keys)) {
          // Array of keys
          keys.forEach(key => {
            result[key] = data[key];
          });
        } else if (typeof keys === 'object') {
          // Object with default values
          Object.keys(keys).forEach(key => {
            result[key] = data[key] !== undefined ? data[key] : (keys as any)[key];
          });
        }
        
        callback(result);
      },
      
      set: (items, callback) => {
        this.logger('info', `chrome.storage.${areaName}.set called with: ${JSON.stringify(items)}`);
        
        const changes: Record<string, StorageChange> = {};
        
        // Track changes for each item
        Object.keys(items).forEach(key => {
          const oldValue = data[key];
          const newValue = (items as any)[key];
          
          // Only create a change event if the value is actually different
          if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes[key] = { oldValue, newValue };
            data[key] = newValue;
          }
        });
        
        // If we have changes and listeners, notify them
        if (Object.keys(changes).length > 0 && this.storageListeners.length > 0) {
          setTimeout(() => {
            this.storageListeners.forEach(listener => {
              listener(changes, areaName);
            });
          }, 0);
        }
        
        if (callback) {
          setTimeout(() => callback(), 0);
        }
      },
      
      remove: (keys, callback) => {
        this.logger('info', `chrome.storage.${areaName}.remove called`);
        
        const changes: Record<string, StorageChange> = {};
        
        if (typeof keys === 'string') {
          // Single key
          if (data[keys] !== undefined) {
            changes[keys] = { oldValue: data[keys] };
            delete data[keys];
          }
        } else if (Array.isArray(keys)) {
          // Array of keys
          keys.forEach(key => {
            if (data[key] !== undefined) {
              changes[key] = { oldValue: data[key] };
              delete data[key];
            }
          });
        }
        
        // If we have changes and listeners, notify them
        if (Object.keys(changes).length > 0 && this.storageListeners.length > 0) {
          setTimeout(() => {
            this.storageListeners.forEach(listener => {
              listener(changes, areaName);
            });
          }, 0);
        }
        
        if (callback) {
          setTimeout(() => callback(), 0);
        }
      },
      
      clear: (callback) => {
        this.logger('info', `chrome.storage.${areaName}.clear called`);
        
        const changes: Record<string, StorageChange> = {};
        
        // Track all cleared items as changes
        Object.keys(data).forEach(key => {
          changes[key] = { oldValue: data[key] };
        });
        
        // Clear the data
        Object.keys(data).forEach(key => {
          delete data[key];
        });
        
        // If we have changes and listeners, notify them
        if (Object.keys(changes).length > 0 && this.storageListeners.length > 0) {
          setTimeout(() => {
            this.storageListeners.forEach(listener => {
              listener(changes, areaName);
            });
          }, 0);
        }
        
        if (callback) {
          setTimeout(() => callback(), 0);
        }
      }
    };
  }

  // Storage areas
  get local() {
    return this.createStorageArea('local', this.localData);
  }
  
  get sync() {
    return this.createStorageArea('sync', this.syncData);
  }
  
  get session() {
    return this.createStorageArea('session', this.sessionData);
  }
  
  // Global storage change event
  onChanged = {
    addListener: (callback: StorageListener) => {
      this.logger('info', 'Added chrome.storage.onChanged listener');
      this.storageListeners.push(callback);
    },
    
    removeListener: (callback: StorageListener) => {
      this.logger('info', 'Removed chrome.storage.onChanged listener');
      const index = this.storageListeners.indexOf(callback);
      if (index !== -1) {
        this.storageListeners.splice(index, 1);
      }
    },
    
    hasListeners: () => {
      return this.storageListeners.length > 0;
    }
  };
  
  // Reset all storage data (for simulator reset)
  resetAllStorageData() {
    const changesByArea: Record<string, Record<string, StorageChange>> = {
      local: {},
      sync: {},
      session: {}
    };
    
    // Track changes for local
    Object.keys(this.localData).forEach(key => {
      changesByArea.local[key] = { oldValue: this.localData[key] };
    });
    
    // Track changes for sync
    Object.keys(this.syncData).forEach(key => {
      changesByArea.sync[key] = { oldValue: this.syncData[key] };
    });
    
    // Track changes for session
    Object.keys(this.sessionData).forEach(key => {
      changesByArea.session[key] = { oldValue: this.sessionData[key] };
    });
    
    // Clear all data
    this.localData = {};
    this.syncData = {};
    this.sessionData = {};
    
    // Notify listeners for each area if there are changes
    if (this.storageListeners.length > 0) {
      ['local', 'sync', 'session'].forEach(area => {
        if (Object.keys(changesByArea[area]).length > 0) {
          setTimeout(() => {
            this.storageListeners.forEach(listener => {
              listener(changesByArea[area], area);
            });
          }, 0);
        }
      });
    }
  }
  
  // Get all storage data for display
  getAllStorageData() {
    return {
      local: { ...this.localData },
      sync: { ...this.syncData },
      session: { ...this.sessionData }
    };
  }
}