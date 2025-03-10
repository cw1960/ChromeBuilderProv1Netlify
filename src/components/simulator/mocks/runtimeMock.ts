import { RuntimeMock, MessageSender } from './types';

type MessageListener = (message: any, sender: MessageSender, sendResponse: (response?: any) => void) => void | boolean;

export class ChromeRuntimeMock implements RuntimeMock {
  private manifest: chrome.runtime.Manifest;
  private messageListeners: MessageListener[] = [];
  private logger: (type: 'info' | 'error' | 'warn', message: string) => void;
  public lastError?: { message: string } = undefined;
  public id: string = 'simulated-extension-id';

  constructor(manifest: any, logger: (type: 'info' | 'error' | 'warn', message: string) => void) {
    this.manifest = manifest;
    this.logger = logger;
  }

  // Send a message (from popup to background or vice versa)
  sendMessage(message: any, callback?: (response?: any) => void) {
    this.logger('info', `chrome.runtime.sendMessage called with: ${JSON.stringify(message)}`);
    
    // Simulate extension as the sender
    const sender: MessageSender = {
      id: this.id,
      url: 'chrome-extension://' + this.id + '/popup.html'
    };
    
    const responses: any[] = [];
    let async = false;
    
    // Call all listeners and collect responses
    this.messageListeners.forEach(listener => {
      const sendResponse = (response?: any) => {
        if (response !== undefined) {
          responses.push(response);
        }
      };
      
      // If listener returns true, it plans to respond asynchronously
      const result = listener(message, sender, sendResponse);
      if (result === true) {
        async = true;
      }
    });
    
    // If no async responses expected, call the callback immediately
    if (!async && callback) {
      setTimeout(() => {
        // Just provide the first response if any
        callback(responses.length > 0 ? responses[0] : undefined);
      }, 0);
    }
  }

  // Get the extension's manifest
  getManifest() {
    this.logger('info', 'chrome.runtime.getManifest called');
    return this.manifest;
  }

  // Get a URL relative to the extension root
  getURL(path: string) {
    return `chrome-extension://${this.id}/${path}`;
  }

  // Event listener for incoming messages
  onMessage = {
    addListener: (callback: MessageListener) => {
      this.logger('info', 'Added chrome.runtime.onMessage listener');
      this.messageListeners.push(callback);
    },
    
    removeListener: (callback: MessageListener) => {
      this.logger('info', 'Removed chrome.runtime.onMessage listener');
      const index = this.messageListeners.indexOf(callback);
      if (index !== -1) {
        this.messageListeners.splice(index, 1);
      }
    },
    
    hasListeners: () => {
      return this.messageListeners.length > 0;
    }
  };

  // Set a simulated error (for testing error handling)
  setLastError(message: string) {
    this.lastError = { message };
  }

  // Clear the last error
  clearLastError() {
    this.lastError = undefined;
  }
  
  // Reset runtime state
  reset() {
    this.messageListeners = [];
    this.lastError = undefined;
  }
}