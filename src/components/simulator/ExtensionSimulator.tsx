import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { 
  Bug, 
  Play, 
  Pause, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  Monitor, 
  Database, 
  Activity, 
  Bell,
  LayoutPanelLeft
} from 'lucide-react';

// Import Chrome API mocks
import { ChromeMock } from './mocks/chromeMock';

// Import UI components
import BrowserFrame from './ui/BrowserFrame';
import StorageExplorer from './ui/StorageExplorer';
import NotificationDisplay from './ui/NotificationDisplay';
import NetworkMonitor, { NetworkRequest } from './ui/NetworkMonitor';

// Import Chrome API types from our mocks
import { ChromeApiMocks, Tab } from './mocks/types';

interface SimulatorProps {
  manifestJson: string;
  popupHtml: string;
  backgroundJs: string;
  contentJs?: string;
  height?: string | number;
  width?: string | number;
}

export default function ExtensionSimulator({
  manifestJson,
  popupHtml,
  backgroundJs,
  contentJs,
  height = '600px',
  width = '100%',
}: SimulatorProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'browser' | 'devtools' | 'background' | 'content' | 'logs'>('browser');
  const [devToolsTab, setDevToolsTab] = useState<'storage' | 'network' | 'console'>('console');
  const [logs, setLogs] = useState<Array<{ type: 'info' | 'error' | 'warn'; message: string; timestamp: Date }>>([]);
  const [manifest, setManifest] = useState<any>(null);
  const [chromeMock, setChromeMock] = useState<ChromeMock | null>(null);
  
  // Tabs state
  const [browserTabs, setBrowserTabs] = useState<Tab[]>([]);
  const [activeBrowserTabId, setActiveBrowserTabId] = useState<number>(1);
  const [currentUrl, setCurrentUrl] = useState('https://example.com');
  
  // Network requests state
  const [networkRequests, setNetworkRequests] = useState<NetworkRequest[]>([]);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Parse manifest
  useEffect(() => {
    try {
      const parsed = JSON.parse(manifestJson);
      setManifest(parsed);
    } catch (error) {
      addLog('error', 'Invalid manifest.json format');
    }
  }, [manifestJson]);
  
  // Add a log entry
  const addLog = (type: 'info' | 'error' | 'warn', message: string) => {
    setLogs(prev => [...prev, { type, message, timestamp: new Date() }]);
  };
  
  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };
  
  // Create a network request entry
  const addNetworkRequest = (request: Partial<NetworkRequest>) => {
    const newRequest: NetworkRequest = {
      id: crypto.randomUUID(),
      type: request.type || 'fetch',
      url: request.url || 'unknown',
      method: request.method || 'GET',
      timestamp: request.timestamp || new Date(),
      ...request
    };
    
    setNetworkRequests(prev => [newRequest, ...prev]);
    return newRequest.id;
  };
  
  // Update a network request with response
  const updateNetworkRequest = (id: string, updates: Partial<NetworkRequest>) => {
    setNetworkRequests(prev => 
      prev.map(req => 
        req.id === id ? { ...req, ...updates } : req
      )
    );
  };
  
  // Clear network requests
  const clearNetworkRequests = () => {
    setNetworkRequests([]);
  };
  
  // Create Chrome mock instance with logger
  const createChromeMockInstance = () => {
    const logger = (type: 'info' | 'error' | 'warn', message: string) => {
      addLog(type, message);
    };
    
    const mock = new ChromeMock(manifest, logger);
    
    // Initialize with a default tab
    setBrowserTabs(mock.tabs.getAllTabs());
    setActiveBrowserTabId(mock.tabs.getAllTabs()[0]?.id || 1);
    setCurrentUrl(mock.tabs.getAllTabs()[0]?.url || 'https://example.com');
    
    return mock;
  };
  
  // Reset simulator
  const resetSimulator = () => {
    clearLogs();
    clearNetworkRequests();
    
    // Reset Chrome mock state
    if (chromeMock) {
      chromeMock.reset();
      
      // Update tabs state after reset
      setBrowserTabs(chromeMock.tabs.getAllTabs());
      setActiveBrowserTabId(chromeMock.tabs.getAllTabs()[0]?.id || 1);
      setCurrentUrl(chromeMock.tabs.getAllTabs()[0]?.url || 'https://example.com');
    }
    
    // If running, restart the simulator
    if (isRunning) {
      setIsRunning(false);
      setTimeout(() => setIsRunning(true), 100);
    }
  };
  
  // Tab management functions
  const handleTabClick = (tabId: number) => {
    if (!chromeMock) return;
    
    // Update active tab in tabs mock
    chromeMock.tabs.update(tabId, { active: true }, (tab) => {
      if (tab) {
        setActiveBrowserTabId(tab.id);
        setCurrentUrl(tab.url || '');
      }
    });
    
    // Update our tabs state
    setBrowserTabs(chromeMock.tabs.getAllTabs());
  };
  
  const handleTabClose = (tabId: number) => {
    if (!chromeMock) return;
    
    // Don't close the last tab
    if (browserTabs.length <= 1) return;
    
    // Remove tab from tabs mock
    chromeMock.tabs.remove(tabId, () => {
      // Get updated tabs and set active tab
      const tabs = chromeMock.tabs.getAllTabs();
      setBrowserTabs(tabs);
      
      // If we closed the active tab, make another one active
      if (tabId === activeBrowserTabId && tabs.length > 0) {
        const newActiveTab = tabs.find(t => t.active) || tabs[0];
        setActiveBrowserTabId(newActiveTab.id);
        setCurrentUrl(newActiveTab.url || '');
      }
    });
  };
  
  const handleNewTab = () => {
    if (!chromeMock) return;
    
    // Create a new tab in tabs mock
    chromeMock.tabs.create({ url: 'about:blank' }, (tab) => {
      setBrowserTabs(chromeMock.tabs.getAllTabs());
      setActiveBrowserTabId(tab.id);
      setCurrentUrl(tab.url || '');
    });
  };
  
  const handleNavigate = (url: string) => {
    if (!chromeMock) return;
    
    // Update the active tab's URL
    chromeMock.tabs.update(activeBrowserTabId, { url }, (tab) => {
      if (tab) {
        setCurrentUrl(tab.url || '');
      }
      
      // Update tabs state
      setBrowserTabs(chromeMock.tabs.getAllTabs());
    });
  };
  
  const handleRefresh = () => {
    // Reload the iframe
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      iframe.src = 'about:blank';
      setTimeout(() => {
        iframe.srcdoc = popupHtml;
      }, 50);
    }
  };
  
  // Storage management functions
  const handleUpdateStorage = (area: 'local' | 'sync' | 'session', key: string, value: any) => {
    if (!chromeMock) return;
    
    // Create object with single key-value pair
    const items = { [key]: value };
    
    // Use the appropriate storage area
    switch (area) {
      case 'local':
        chromeMock.storage.local.set(items);
        break;
      case 'sync':
        chromeMock.storage.sync.set(items);
        break;
      case 'session':
        chromeMock.storage.session.set(items);
        break;
    }
  };
  
  const handleDeleteStorage = (area: 'local' | 'sync' | 'session', key: string) => {
    if (!chromeMock) return;
    
    // Use the appropriate storage area
    switch (area) {
      case 'local':
        chromeMock.storage.local.remove(key);
        break;
      case 'sync':
        chromeMock.storage.sync.remove(key);
        break;
      case 'session':
        chromeMock.storage.session.remove(key);
        break;
    }
  };
  
  const handleClearStorage = (area: 'local' | 'sync' | 'session') => {
    if (!chromeMock) return;
    
    // Use the appropriate storage area
    switch (area) {
      case 'local':
        chromeMock.storage.local.clear();
        break;
      case 'sync':
        chromeMock.storage.sync.clear();
        break;
      case 'session':
        chromeMock.storage.session.clear();
        break;
    }
  };
  
  // Notification management functions
  const handleNotificationClick = (id: string) => {
    if (!chromeMock) return;
    chromeMock.simulateNotificationClick(id);
  };
  
  const handleNotificationButtonClick = (id: string, buttonIndex: number) => {
    if (!chromeMock) return;
    chromeMock.simulateNotificationButtonClick(id, buttonIndex);
  };
  
  const handleNotificationClose = (id: string) => {
    if (!chromeMock) return;
    chromeMock.simulateNotificationClose(id, true);
  };
  
  // Toggle simulator running state
  const toggleRunning = () => {
    setIsRunning(!isRunning);
    if (!isRunning) {
      addLog('info', 'Simulator started');
      
      // Create a new Chrome mock instance
      const newChromeMock = createChromeMockInstance();
      setChromeMock(newChromeMock);
    } else {
      addLog('info', 'Simulator stopped');
    }
  };
  
  // Setup fetch and XHR interception when the simulator starts
  useEffect(() => {
    if (isRunning && iframeRef.current?.contentWindow) {
      const iframe = iframeRef.current;
      
      // Wait for iframe to load
      iframe.onload = () => {
        if (!iframe.contentWindow) return;
        
        // Intercept fetch API
        const originalFetch = iframe.contentWindow.fetch;
        iframe.contentWindow.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          let url = typeof input === 'string' ? input : input.url;
          let method = init?.method || 'GET';
          
          // Create a network request entry
          const requestId = addNetworkRequest({
            type: 'fetch',
            url,
            method,
            timestamp: new Date(),
            requestHeaders: init?.headers ? Object.fromEntries(new Headers(init.headers).entries()) : undefined,
            requestBody: init?.body ? init.body : undefined
          });
          
          try {
            // Record start time
            const startTime = performance.now();
            
            // Call original fetch
            const response = await originalFetch(input, init);
            
            // Clone the response so we can read it twice
            const responseClone = response.clone();
            
            // Try to get response body
            let responseBody: any;
            const contentType = response.headers.get('content-type');
            
            if (contentType?.includes('application/json')) {
              responseBody = await responseClone.json();
            } else if (contentType?.includes('text/')) {
              responseBody = await responseClone.text();
            }
            
            // Calculate duration
            const duration = Math.round(performance.now() - startTime);
            
            // Update network request with response
            updateNetworkRequest(requestId, {
              status: response.status,
              statusText: response.statusText,
              duration,
              responseHeaders: Object.fromEntries(response.headers.entries()),
              responseBody
            });
            
            return response;
          } catch (error) {
            // Update network request with error
            updateNetworkRequest(requestId, {
              error: error instanceof Error ? error.message : String(error),
              duration: 0
            });
            
            throw error;
          }
        };
        
        // Intercept XMLHttpRequest
        const XHR = iframe.contentWindow.XMLHttpRequest;
        iframe.contentWindow.XMLHttpRequest = class extends XHR {
          private requestId: string | null = null;
          private startTime: number = 0;
          
          constructor() {
            super();
            
            // Intercept XHR events
            this.addEventListener('loadstart', () => {
              this.startTime = performance.now();
            });
            
            this.addEventListener('loadend', () => {
              if (this.requestId && this.readyState === 4) {
                // Calculate duration
                const duration = Math.round(performance.now() - this.startTime);
                
                // Get response headers
                const responseHeaders: Record<string, string> = {};
                const allHeaders = this.getAllResponseHeaders();
                const headerLines = allHeaders.split('\r\n');
                headerLines.forEach(line => {
                  if (line) {
                    const parts = line.split(': ');
                    responseHeaders[parts[0]] = parts[1];
                  }
                });
                
                // Get response body
                let responseBody: any;
                try {
                  const contentType = this.getResponseHeader('content-type');
                  if (contentType?.includes('application/json')) {
                    responseBody = JSON.parse(this.responseText);
                  } else {
                    responseBody = this.responseText;
                  }
                } catch (e) {
                  responseBody = this.responseText;
                }
                
                // Update network request
                updateNetworkRequest(this.requestId, {
                  status: this.status,
                  statusText: this.statusText,
                  duration,
                  responseHeaders,
                  responseBody
                });
              }
            });
          }
          
          open(method: string, url: string) {
            // Create network request entry
            this.requestId = addNetworkRequest({
              type: 'xhr',
              url,
              method,
              timestamp: new Date()
            });
            
            super.open(method, url);
          }
          
          send(body?: Document | XMLHttpRequestBodyInit) {
            if (this.requestId) {
              // Update request with body
              updateNetworkRequest(this.requestId, {
                requestBody: body ? body : undefined
              });
            }
            
            super.send(body);
          }
          
          setRequestHeader(name: string, value: string) {
            if (this.requestId) {
              // Update request headers
              updateNetworkRequest(this.requestId, {
                requestHeaders: { 
                  ...(networkRequests.find(r => r.id === this.requestId)?.requestHeaders || {}),
                  [name]: value 
                }
              });
            }
            
            super.setRequestHeader(name, value);
          }
        };
      };
    }
  }, [isRunning, popupHtml]);
  
  // Inject Chrome API mocks into the iframe
  useEffect(() => {
    if (isRunning && iframeRef.current && chromeMock) {
      const iframe = iframeRef.current;
      
      // Wait for iframe to load
      iframe.onload = () => {
        if (!iframe.contentWindow) return;
        
        // Add chrome API mocks to the iframe
        Object.defineProperty(iframe.contentWindow, 'chrome', {
          value: chromeMock,
          writable: false
        });
        
        // Add console log interceptors
        const originalConsole = iframe.contentWindow.console;
        iframe.contentWindow.console.log = (...args) => {
          addLog('info', args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' '));
          originalConsole.log(...args);
        };
        
        iframe.contentWindow.console.error = (...args) => {
          addLog('error', args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' '));
          originalConsole.error(...args);
        };
        
        iframe.contentWindow.console.warn = (...args) => {
          addLog('warn', args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' '));
          originalConsole.warn(...args);
        };
        
        // Execute background script if it exists
        if (backgroundJs) {
          try {
            const script = iframe.contentDocument?.createElement('script');
            if (script) {
              script.textContent = backgroundJs;
              iframe.contentDocument?.head.appendChild(script);
              addLog('info', 'Background script loaded');
            }
          } catch (error) {
            console.error('Error executing background script:', error);
            addLog('error', `Background script error: ${error}`);
          }
        }
      };
    }
  }, [isRunning, backgroundJs, chromeMock]);
  
  return (
    <div
      className={`border border-border rounded-md overflow-hidden bg-card shadow-sm ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
      style={{ height: isFullscreen ? '100%' : height, width: isFullscreen ? '100%' : width }}
    >
      <div className="border-b border-border p-2 bg-muted flex items-center justify-between">
        <h3 className="font-medium text-foreground flex items-center">
          <Monitor size={16} className="mr-2" />
          {manifest?.name || 'Extension Simulator'}
        </h3>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleRunning}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-background"
            title={isRunning ? 'Stop simulator' : 'Start simulator'}
          >
            {isRunning ? <Pause size={16} /> : <Play size={16} />}
          </button>
          
          <button
            onClick={resetSimulator}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-background"
            title="Reset simulator"
          >
            <RefreshCw size={16} />
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-background"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
      
      <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as any)}>
        <div className="border-b border-border">
          <TabsList className="flex">
            <TabsTrigger 
              value="browser" 
              className={`flex-1 px-4 py-2 text-sm font-medium border-r border-border ${
                currentTab === 'browser' ? 'bg-background' : 'bg-muted'
              }`}
            >
              Browser
            </TabsTrigger>
            
            <TabsTrigger 
              value="devtools" 
              className={`flex-1 px-4 py-2 text-sm font-medium border-r border-border ${
                currentTab === 'devtools' ? 'bg-background' : 'bg-muted'
              }`}
            >
              DevTools
            </TabsTrigger>
            
            <TabsTrigger 
              value="background" 
              className={`flex-1 px-4 py-2 text-sm font-medium border-r border-border ${
                currentTab === 'background' ? 'bg-background' : 'bg-muted'
              }`}
            >
              Background
            </TabsTrigger>
            
            {contentJs && (
              <TabsTrigger 
                value="content" 
                className={`flex-1 px-4 py-2 text-sm font-medium border-r border-border ${
                  currentTab === 'content' ? 'bg-background' : 'bg-muted'
                }`}
              >
                Content Script
              </TabsTrigger>
            )}
            
            <TabsTrigger 
              value="logs" 
              className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center ${
                currentTab === 'logs' ? 'bg-background' : 'bg-muted'
              }`}
            >
              <Bug size={14} className="mr-1" />
              Logs ({logs.length})
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* Browser Tab - Shows the extension in a browser-like frame */}
        <TabsContent value="browser" className="bg-gray-100 p-4">
          {isRunning ? (
            <BrowserFrame
              tabs={browserTabs}
              activeTabId={activeBrowserTabId}
              onTabClick={handleTabClick}
              onTabClose={handleTabClose}
              onNewTab={handleNewTab}
              onRefresh={handleRefresh}
              currentUrl={currentUrl}
              onNavigate={handleNavigate}
            >
              <iframe
                ref={iframeRef}
                srcDoc={popupHtml}
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
                title="Extension Popup Simulator"
              />
            </BrowserFrame>
          ) : (
            <div className="flex items-center justify-center h-64 bg-white rounded-md border border-gray-200 shadow-sm text-gray-500">
              <div className="text-center">
                <Play size={32} className="mx-auto mb-2 opacity-40" />
                <p>Press Play to start the simulator</p>
              </div>
            </div>
          )}
          
          {/* Notifications display */}
          {chromeMock && isRunning && (
            <NotificationDisplay
              notifications={chromeMock.getActiveNotifications()}
              onNotificationClick={handleNotificationClick}
              onButtonClick={handleNotificationButtonClick}
              onClose={handleNotificationClose}
            />
          )}
        </TabsContent>
        
        {/* DevTools Tab - Shows development tools for the extension */}
        <TabsContent value="devtools" className="bg-gray-100 p-4">
          <div className="mb-4 bg-white border border-gray-200 rounded-md shadow-sm p-2">
            <div className="flex">
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  devToolsTab === 'console' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setDevToolsTab('console')}
              >
                Console
              </button>
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  devToolsTab === 'storage' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setDevToolsTab('storage')}
              >
                <span className="flex items-center justify-center">
                  <Database size={14} className="mr-1" />
                  Storage
                </span>
              </button>
              <button
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  devToolsTab === 'network' 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setDevToolsTab('network')}
              >
                <span className="flex items-center justify-center">
                  <Activity size={14} className="mr-1" />
                  Network
                </span>
              </button>
            </div>
          </div>
          
          {devToolsTab === 'console' && (
            <div className="bg-white border border-gray-200 rounded-md shadow-sm">
              <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <h3 className="font-medium flex items-center">
                  <Bug size={16} className="mr-2 text-blue-600" />
                  Console
                </h3>
                <button
                  onClick={clearLogs}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear console
                </button>
              </div>
              
              <div className="bg-white p-2 h-96 overflow-y-auto font-mono">
                {logs.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No logs available
                  </div>
                ) : (
                  <div className="space-y-1 text-xs">
                    {logs.map((log, index) => (
                      <div 
                        key={index}
                        className={`p-1 rounded ${
                          log.type === 'error' ? 'bg-red-50 text-red-800' :
                          log.type === 'warn' ? 'bg-amber-50 text-amber-800' :
                          'text-gray-800'
                        }`}
                      >
                        <span className="text-gray-500">[{log.timestamp.toLocaleTimeString()}]</span>{' '}
                        {log.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {devToolsTab === 'storage' && chromeMock && (
            <StorageExplorer
              storageData={chromeMock.storage.getAllStorageData()}
              onUpdateStorage={handleUpdateStorage}
              onDeleteStorage={handleDeleteStorage}
              onClearStorage={handleClearStorage}
            />
          )}
          
          {devToolsTab === 'network' && (
            <NetworkMonitor
              requests={networkRequests}
              onClearRequests={clearNetworkRequests}
            />
          )}
        </TabsContent>
        
        {/* Background Script Tab */}
        <TabsContent value="background">
          <div className="p-4 bg-gray-50">
            <h4 className="text-sm font-medium mb-2">Background Service Worker</h4>
            <pre className="bg-white border border-gray-200 p-3 rounded-md text-xs overflow-auto max-h-96 whitespace-pre-wrap">
              <code>{backgroundJs}</code>
            </pre>
            
            {isRunning ? (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-md text-sm">
                Service worker is running in the simulated environment.
              </div>
            ) : (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-sm">
                Service worker is not running. Press Play to start the simulator.
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Content Script Tab */}
        {contentJs && (
          <TabsContent value="content">
            <div className="p-4 bg-gray-50">
              <h4 className="text-sm font-medium mb-2">Content Script</h4>
              <pre className="bg-white border border-gray-200 p-3 rounded-md text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                <code>{contentJs}</code>
              </pre>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-md text-sm">
                Content scripts would run on matching web pages. In this simulator, they
                are only displayed for reference.
              </div>
            </div>
          </TabsContent>
        )}
        
        {/* Logs Tab */}
        <TabsContent value="logs">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Extension Logs</h4>
              <button
                onClick={clearLogs}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
              >
                Clear logs
              </button>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-md p-2 h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No logs available
                </div>
              ) : (
                <div className="space-y-1 font-mono text-xs">
                  {logs.map((log, index) => (
                    <div 
                      key={index}
                      className={`p-1 rounded ${
                        log.type === 'error' ? 'bg-red-50 text-red-800' :
                        log.type === 'warn' ? 'bg-amber-50 text-amber-800' :
                        'bg-blue-50 text-blue-800'
                      }`}
                    >
                      <span className="text-gray-500">[{log.timestamp.toLocaleTimeString()}]</span>{' '}
                      {log.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {chromeMock && (
              <div className="mt-4 bg-blue-50 border border-blue-200 p-3 rounded-md">
                <div className="flex items-center">
                  <Database size={16} className="text-blue-600 mr-2" />
                  <h4 className="font-medium text-blue-800">Storage Data</h4>
                </div>
                <div className="mt-2 max-h-60 overflow-y-auto bg-white border border-blue-100 p-2 rounded text-xs">
                  <pre>{JSON.stringify(chromeMock.storage.getAllStorageData(), null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}