import { TabsMock, Tab, QueryInfo, CreateProperties, UpdateProperties, TabsUpdateInfo } from './types';

type TabCreatedListener = (tab: Tab) => void;
type TabUpdatedListener = (tabId: number, changeInfo: TabsUpdateInfo, tab: Tab) => void;
type TabRemovedListener = (tabId: number, removeInfo: { windowId: number, isWindowClosing: boolean }) => void;

export class ChromeTabsMock implements TabsMock {
  private tabs: Tab[] = [];
  private nextTabId: number = 1;
  private createdListeners: TabCreatedListener[] = [];
  private updatedListeners: TabUpdatedListener[] = [];
  private removedListeners: TabRemovedListener[] = [];
  private logger: (type: 'info' | 'error' | 'warn', message: string) => void;
  
  constructor(logger: (type: 'info' | 'error' | 'warn', message: string) => void) {
    this.logger = logger;
    
    // Initialize with a default tab
    this.tabs.push(this.createDefaultTab());
  }
  
  // Create a default tab
  private createDefaultTab(): Tab {
    return {
      id: this.nextTabId++,
      index: 0,
      windowId: 1,
      highlighted: false,
      active: true,
      pinned: false,
      url: 'https://example.com',
      title: 'Example Domain',
      favIconUrl: 'https://example.com/favicon.ico',
      status: 'complete',
      incognito: false,
      audible: false
    };
  }
  
  // Query tabs
  query(queryInfo: QueryInfo, callback: (tabs: Tab[]) => void) {
    this.logger('info', `chrome.tabs.query called with: ${JSON.stringify(queryInfo)}`);
    
    let result = [...this.tabs];
    
    // Apply filters based on queryInfo
    if (queryInfo.active !== undefined) {
      result = result.filter(tab => tab.active === queryInfo.active);
    }
    
    if (queryInfo.currentWindow !== undefined && queryInfo.currentWindow) {
      result = result.filter(tab => tab.windowId === 1); // Assume 1 is current window
    }
    
    if (queryInfo.url !== undefined) {
      if (typeof queryInfo.url === 'string') {
        // Simple string matching for demo
        result = result.filter(tab => tab.url?.includes(queryInfo.url as string));
      } else if (Array.isArray(queryInfo.url)) {
        // Match any of the URLs in the array
        result = result.filter(tab => 
          tab.url !== undefined && 
          (queryInfo.url as string[]).some(url => tab.url?.includes(url))
        );
      }
    }
    
    if (queryInfo.windowId !== undefined) {
      result = result.filter(tab => tab.windowId === queryInfo.windowId);
    }
    
    // Additional filtering could be added for more queryInfo properties
    
    setTimeout(() => callback(result), 0);
  }
  
  // Create a new tab
  create(createProperties: CreateProperties, callback?: (tab: Tab) => void) {
    this.logger('info', `chrome.tabs.create called with: ${JSON.stringify(createProperties)}`);
    
    const newTab: Tab = {
      id: this.nextTabId++,
      index: this.tabs.length,
      windowId: createProperties.windowId || 1,
      highlighted: createProperties.highlighted || false,
      active: createProperties.active !== undefined ? createProperties.active : true,
      pinned: createProperties.pinned || false,
      url: createProperties.url || 'about:blank',
      title: 'New Tab',
      status: 'loading',
      incognito: false,
      audible: false
    };
    
    // Add to tabs list
    this.tabs.push(newTab);
    
    // Notify tab created listeners
    setTimeout(() => {
      this.createdListeners.forEach(listener => {
        listener({ ...newTab });
      });
    }, 0);
    
    // Simulate tab loading completion after a delay
    setTimeout(() => {
      const updatedTab = this.tabs.find(t => t.id === newTab.id);
      if (updatedTab) {
        updatedTab.status = 'complete';
        updatedTab.title = updatedTab.url === 'about:blank' ? 'New Tab' : updatedTab.url?.split('/')[2] || 'Page';
        
        // Notify tab updated listeners
        const changeInfo: TabsUpdateInfo = {
          status: 'complete',
          title: updatedTab.title
        };
        
        this.updatedListeners.forEach(listener => {
          listener(updatedTab.id, changeInfo, { ...updatedTab });
        });
      }
    }, 300);
    
    if (callback) {
      setTimeout(() => callback({ ...newTab }), 0);
    }
    
    return newTab.id;
  }
  
  // Update a tab
  update(tabId: number, updateProperties: UpdateProperties, callback?: (tab?: Tab) => void) {
    this.logger('info', `chrome.tabs.update called for tab ${tabId} with: ${JSON.stringify(updateProperties)}`);
    
    const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
    
    if (tabIndex === -1) {
      // Tab not found, simulate an error
      setTimeout(() => {
        if (callback) callback(undefined);
      }, 0);
      return;
    }
    
    const tab = this.tabs[tabIndex];
    const changeInfo: TabsUpdateInfo = {};
    
    // Update the tab properties
    if (updateProperties.url !== undefined) {
      tab.url = updateProperties.url;
      tab.status = 'loading';
      changeInfo.url = updateProperties.url;
      changeInfo.status = 'loading';
      
      // Simulate load completion
      setTimeout(() => {
        tab.status = 'complete';
        tab.title = tab.url?.split('/')[2] || 'Page';
        
        const loadChangeInfo: TabsUpdateInfo = {
          status: 'complete',
          title: tab.title
        };
        
        this.updatedListeners.forEach(listener => {
          listener(tab.id, loadChangeInfo, { ...tab });
        });
      }, 300);
    }
    
    if (updateProperties.active !== undefined) {
      // If making this tab active, make others inactive
      if (updateProperties.active) {
        this.tabs.forEach(t => {
          if (t.id !== tabId && t.active) {
            t.active = false;
          }
        });
      }
      
      tab.active = updateProperties.active;
    }
    
    if (updateProperties.pinned !== undefined) {
      tab.pinned = updateProperties.pinned;
      changeInfo.pinned = updateProperties.pinned;
    }
    
    // Notify tab updated listeners if there are changes
    if (Object.keys(changeInfo).length > 0) {
      setTimeout(() => {
        this.updatedListeners.forEach(listener => {
          listener(tab.id, changeInfo, { ...tab });
        });
      }, 0);
    }
    
    if (callback) {
      setTimeout(() => callback({ ...tab }), 0);
    }
  }
  
  // Remove tab(s)
  remove(tabIds: number | number[], callback?: () => void) {
    const ids = Array.isArray(tabIds) ? tabIds : [tabIds];
    this.logger('info', `chrome.tabs.remove called for tabs: ${ids.join(', ')}`);
    
    ids.forEach(tabId => {
      const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
      
      if (tabIndex !== -1) {
        const tab = this.tabs[tabIndex];
        this.tabs.splice(tabIndex, 1);
        
        // Notify tab removed listeners
        setTimeout(() => {
          this.removedListeners.forEach(listener => {
            listener(tabId, { windowId: tab.windowId, isWindowClosing: false });
          });
        }, 0);
      }
    });
    
    if (callback) {
      setTimeout(() => callback(), 0);
    }
  }
  
  // Get a tab by ID
  get(tabId: number, callback: (tab: Tab) => void) {
    this.logger('info', `chrome.tabs.get called for tab ${tabId}`);
    
    const tab = this.tabs.find(t => t.id === tabId);
    
    if (tab) {
      setTimeout(() => callback({ ...tab }), 0);
    } else {
      // In real Chrome this would throw
      this.logger('error', `Tab ${tabId} not found`);
    }
  }
  
  // Get the current active tab
  getCurrent(callback: (tab?: Tab) => void) {
    this.logger('info', 'chrome.tabs.getCurrent called');
    
    // Simulate the current popup's tab (usually doesn't apply to popups, but useful for testing)
    const fakeCurrentTab: Tab = {
      id: 9999,
      index: 0,
      windowId: 1,
      highlighted: false,
      active: true,
      pinned: false,
      url: 'chrome-extension://simulated-extension-id/popup.html',
      title: 'Extension Popup',
      status: 'complete',
      incognito: false,
      audible: false
    };
    
    setTimeout(() => callback(fakeCurrentTab), 0);
  }
  
  // Send a message to a specific tab
  sendMessage(tabId: number, message: any, options?: any, callback?: (response: any) => void) {
    this.logger('info', `chrome.tabs.sendMessage called for tab ${tabId} with: ${JSON.stringify(message)}`);
    
    // For simulation, just echo the message back
    if (callback) {
      setTimeout(() => callback({ success: true, echo: message }), 0);
    }
  }
  
  // Tab created event
  onCreated = {
    addListener: (callback: TabCreatedListener) => {
      this.logger('info', 'Added chrome.tabs.onCreated listener');
      this.createdListeners.push(callback);
    },
    
    removeListener: (callback: TabCreatedListener) => {
      this.logger('info', 'Removed chrome.tabs.onCreated listener');
      const index = this.createdListeners.indexOf(callback);
      if (index !== -1) {
        this.createdListeners.splice(index, 1);
      }
    },
    
    hasListeners: () => {
      return this.createdListeners.length > 0;
    }
  };
  
  // Tab updated event
  onUpdated = {
    addListener: (callback: TabUpdatedListener) => {
      this.logger('info', 'Added chrome.tabs.onUpdated listener');
      this.updatedListeners.push(callback);
    },
    
    removeListener: (callback: TabUpdatedListener) => {
      this.logger('info', 'Removed chrome.tabs.onUpdated listener');
      const index = this.updatedListeners.indexOf(callback);
      if (index !== -1) {
        this.updatedListeners.splice(index, 1);
      }
    },
    
    hasListeners: () => {
      return this.updatedListeners.length > 0;
    }
  };
  
  // Tab removed event
  onRemoved = {
    addListener: (callback: TabRemovedListener) => {
      this.logger('info', 'Added chrome.tabs.onRemoved listener');
      this.removedListeners.push(callback);
    },
    
    removeListener: (callback: TabRemovedListener) => {
      this.logger('info', 'Removed chrome.tabs.onRemoved listener');
      const index = this.removedListeners.indexOf(callback);
      if (index !== -1) {
        this.removedListeners.splice(index, 1);
      }
    },
    
    hasListeners: () => {
      return this.removedListeners.length > 0;
    }
  };
  
  // Get all tabs (for simulator display)
  getAllTabs() {
    return [...this.tabs];
  }
  
  // Reset tabs (for simulator reset)
  resetTabs() {
    this.tabs = [this.createDefaultTab()];
    this.nextTabId = 2; // Next ID after the default tab
    
    // Don't reset listeners as they're bound to the simulator UI
  }
}