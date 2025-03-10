import { ChromeApiMocks, NotificationOptions, PermissionsMock } from './types';
import { ChromeStorageMock } from './storageMock';
import { ChromeRuntimeMock } from './runtimeMock';
import { ChromeTabsMock } from './tabsMock';

export class ChromeMock implements ChromeApiMocks {
  storage: ChromeStorageMock;
  runtime: ChromeRuntimeMock;
  tabs: ChromeTabsMock;
  permissions: PermissionsMock;
  notifications: any;
  
  private logger: (type: 'info' | 'error' | 'warn', message: string) => void;
  private activeNotifications: Record<string, NotificationOptions> = {};
  private notificationIdCounter: number = 1;
  private notificationClickListeners: ((notificationId: string) => void)[] = [];
  private notificationButtonClickListeners: ((notificationId: string, buttonIndex: number) => void)[] = [];
  private notificationCloseListeners: ((notificationId: string, byUser: boolean) => void)[] = [];
  
  constructor(manifest: any, logger: (type: 'info' | 'error' | 'warn', message: string) => void) {
    this.logger = logger;
    
    // Initialize each API mock
    this.storage = new ChromeStorageMock(logger);
    this.runtime = new ChromeRuntimeMock(manifest, logger);
    this.tabs = new ChromeTabsMock(logger);
    
    // Basic permissions mock
    this.permissions = this.createPermissionsMock();
    
    // Basic notifications mock
    this.notifications = this.createNotificationsMock();
  }
  
  // Create a basic permissions API mock
  private createPermissionsMock(): PermissionsMock {
    // Keep track of granted permissions
    const grantedPermissions = {
      permissions: [] as string[],
      origins: [] as string[]
    };
    
    return {
      request: (permissions, callback) => {
        this.logger('info', `chrome.permissions.request called with: ${JSON.stringify(permissions)}`);
        
        // Simulate user allowing the permission
        if (permissions.permissions) {
          grantedPermissions.permissions.push(...permissions.permissions);
        }
        
        if (permissions.origins) {
          grantedPermissions.origins.push(...permissions.origins);
        }
        
        if (callback) {
          setTimeout(() => callback(true), 0);
        }
      },
      
      contains: (permissions, callback) => {
        this.logger('info', `chrome.permissions.contains called with: ${JSON.stringify(permissions)}`);
        
        let hasAll = true;
        
        if (permissions.permissions) {
          hasAll = permissions.permissions.every(p => 
            grantedPermissions.permissions.includes(p)
          );
        }
        
        if (hasAll && permissions.origins) {
          hasAll = permissions.origins.every(o => 
            grantedPermissions.origins.includes(o)
          );
        }
        
        setTimeout(() => callback(hasAll), 0);
      },
      
      getAll: (callback) => {
        this.logger('info', 'chrome.permissions.getAll called');
        setTimeout(() => callback({ 
          permissions: [...grantedPermissions.permissions], 
          origins: [...grantedPermissions.origins] 
        }), 0);
      },
      
      remove: (permissions, callback) => {
        this.logger('info', `chrome.permissions.remove called with: ${JSON.stringify(permissions)}`);
        
        let removed = false;
        
        if (permissions.permissions) {
          permissions.permissions.forEach(p => {
            const index = grantedPermissions.permissions.indexOf(p);
            if (index !== -1) {
              grantedPermissions.permissions.splice(index, 1);
              removed = true;
            }
          });
        }
        
        if (permissions.origins) {
          permissions.origins.forEach(o => {
            const index = grantedPermissions.origins.indexOf(o);
            if (index !== -1) {
              grantedPermissions.origins.splice(index, 1);
              removed = true;
            }
          });
        }
        
        if (callback) {
          setTimeout(() => callback(removed), 0);
        }
      },
      
      onAdded: {
        addListener: (callback) => {
          this.logger('info', 'Added chrome.permissions.onAdded listener');
          // For simplicity, we don't actually store these listeners in this demo
        },
        removeListener: (callback) => {
          this.logger('info', 'Removed chrome.permissions.onAdded listener');
        },
        hasListeners: () => false
      },
      
      onRemoved: {
        addListener: (callback) => {
          this.logger('info', 'Added chrome.permissions.onRemoved listener');
        },
        removeListener: (callback) => {
          this.logger('info', 'Removed chrome.permissions.onRemoved listener');
        },
        hasListeners: () => false
      }
    };
  }
  
  // Create a basic notifications API mock
  private createNotificationsMock() {
    return {
      create: (notificationId: string | undefined, options: NotificationOptions, callback?: (notificationId: string) => void) => {
        this.logger('info', `chrome.notifications.create called with: ${JSON.stringify(options)}`);
        
        // Generate ID if not provided
        const id = notificationId || `notification-${this.notificationIdCounter++}`;
        
        // Store the notification
        this.activeNotifications[id] = options;
        
        // Display a simulated notification in the simulator UI
        this.simulateNotificationDisplay(id, options);
        
        if (callback) {
          setTimeout(() => callback(id), 0);
        }
      },
      
      update: (notificationId: string, options: NotificationOptions, callback?: (wasUpdated: boolean) => void) => {
        this.logger('info', `chrome.notifications.update called for notification ${notificationId}`);
        
        const wasUpdated = notificationId in this.activeNotifications;
        
        if (wasUpdated) {
          // Update stored notification
          this.activeNotifications[notificationId] = {
            ...this.activeNotifications[notificationId],
            ...options
          };
          
          // Update display
          this.simulateNotificationDisplay(notificationId, this.activeNotifications[notificationId]);
        }
        
        if (callback) {
          setTimeout(() => callback(wasUpdated), 0);
        }
      },
      
      clear: (notificationId: string, callback?: (wasCleared: boolean) => void) => {
        this.logger('info', `chrome.notifications.clear called for notification ${notificationId}`);
        
        const wasCleared = notificationId in this.activeNotifications;
        
        if (wasCleared) {
          // Remove notification
          delete this.activeNotifications[notificationId];
          
          // Notify close listeners (not by user)
          setTimeout(() => {
            this.notificationCloseListeners.forEach(listener => {
              listener(notificationId, false);
            });
          }, 0);
        }
        
        if (callback) {
          setTimeout(() => callback(wasCleared), 0);
        }
      },
      
      getAll: (callback: (notifications: { [key: string]: any }) => void) => {
        this.logger('info', 'chrome.notifications.getAll called');
        setTimeout(() => callback({ ...this.activeNotifications }), 0);
      },
      
      onClicked: {
        addListener: (callback: (notificationId: string) => void) => {
          this.logger('info', 'Added chrome.notifications.onClicked listener');
          this.notificationClickListeners.push(callback);
        },
        removeListener: (callback: (notificationId: string) => void) => {
          this.logger('info', 'Removed chrome.notifications.onClicked listener');
          const index = this.notificationClickListeners.indexOf(callback);
          if (index !== -1) {
            this.notificationClickListeners.splice(index, 1);
          }
        },
        hasListeners: () => this.notificationClickListeners.length > 0
      },
      
      onButtonClicked: {
        addListener: (callback: (notificationId: string, buttonIndex: number) => void) => {
          this.logger('info', 'Added chrome.notifications.onButtonClicked listener');
          this.notificationButtonClickListeners.push(callback);
        },
        removeListener: (callback: (notificationId: string, buttonIndex: number) => void) => {
          this.logger('info', 'Removed chrome.notifications.onButtonClicked listener');
          const index = this.notificationButtonClickListeners.indexOf(callback);
          if (index !== -1) {
            this.notificationButtonClickListeners.splice(index, 1);
          }
        },
        hasListeners: () => this.notificationButtonClickListeners.length > 0
      },
      
      onClosed: {
        addListener: (callback: (notificationId: string, byUser: boolean) => void) => {
          this.logger('info', 'Added chrome.notifications.onClosed listener');
          this.notificationCloseListeners.push(callback);
        },
        removeListener: (callback: (notificationId: string, byUser: boolean) => void) => {
          this.logger('info', 'Removed chrome.notifications.onClosed listener');
          const index = this.notificationCloseListeners.indexOf(callback);
          if (index !== -1) {
            this.notificationCloseListeners.splice(index, 1);
          }
        },
        hasListeners: () => this.notificationCloseListeners.length > 0
      }
    };
  }
  
  // Helper method to simulate notification display in UI
  private simulateNotificationDisplay(id: string, options: NotificationOptions) {
    this.logger('info', `Showing notification: ${options.title} - ${options.message}`);
    
    // In a real implementation, this would add the notification to a UI component
    // For now we just log it, but this could be enhanced to show a visual notification in the simulator
  }
  
  // Click a notification (for simulator UI)
  public simulateNotificationClick(notificationId: string) {
    if (notificationId in this.activeNotifications) {
      this.notificationClickListeners.forEach(listener => {
        listener(notificationId);
      });
    }
  }
  
  // Click a notification button (for simulator UI)
  public simulateNotificationButtonClick(notificationId: string, buttonIndex: number) {
    if (notificationId in this.activeNotifications) {
      this.notificationButtonClickListeners.forEach(listener => {
        listener(notificationId, buttonIndex);
      });
    }
  }
  
  // Close a notification (for simulator UI)
  public simulateNotificationClose(notificationId: string, byUser: boolean = true) {
    if (notificationId in this.activeNotifications) {
      delete this.activeNotifications[notificationId];
      
      this.notificationCloseListeners.forEach(listener => {
        listener(notificationId, byUser);
      });
    }
  }
  
  // Get all active notifications (for simulator UI)
  public getActiveNotifications() {
    return { ...this.activeNotifications };
  }
  
  // Reset the entire mock API state (for simulator reset)
  public reset() {
    // Reset storage
    this.storage.resetAllStorageData();
    
    // Reset runtime
    this.runtime.reset();
    
    // Reset tabs
    this.tabs.resetTabs();
    
    // Reset notifications
    this.activeNotifications = {};
    
    this.logger('info', 'Chrome API mocks reset');
  }
}