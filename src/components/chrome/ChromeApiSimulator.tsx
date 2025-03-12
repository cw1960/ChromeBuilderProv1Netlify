import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { Code, Database, Globe, Bell, Shield, Clock } from 'lucide-react';

interface ChromeApiSimulatorProps {
  projectId?: string;
  code?: string;
}

export default function ChromeApiSimulator({ projectId, code }: ChromeApiSimulatorProps) {
  const [activeTab, setActiveTab] = useState('storage');
  const [storageData, setStorageData] = useState<Record<string, any>>({});
  const [tabsData, setTabsData] = useState<any[]>([
    { id: 1, url: 'https://example.com', title: 'Example Domain', active: true },
    { id: 2, url: 'https://google.com', title: 'Google', active: false },
  ]);
  const [permissionsData, setPermissionsData] = useState<string[]>([
    'storage',
    'tabs',
    'activeTab',
  ]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [apiLogs, setApiLogs] = useState<any[]>([]);

  // Simulate Chrome API calls when code changes
  useEffect(() => {
    if (code) {
      try {
        // This is just a simulation - in a real implementation,
        // we would use a sandbox to safely execute the code
        console.log('Simulating code execution:', code);
        
        // Add a log entry
        addApiLog('Code execution', 'Executed extension code');
      } catch (error) {
        console.error('Error simulating code:', error);
      }
    }
  }, [code]);

  const addApiLog = (api: string, action: string) => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      api,
      action,
    };
    setApiLogs((prev) => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  const handleStorageChange = (key: string, value: string) => {
    try {
      const parsedValue = JSON.parse(value);
      setStorageData((prev) => ({ ...prev, [key]: parsedValue }));
      addApiLog('storage.sync', `Set "${key}" to ${value}`);
    } catch (error) {
      // If not valid JSON, store as string
      setStorageData((prev) => ({ ...prev, [key]: value }));
      addApiLog('storage.sync', `Set "${key}" to "${value}"`);
    }
  };

  const addStorageItem = () => {
    const key = prompt('Enter storage key:');
    if (!key) return;
    
    const value = prompt('Enter storage value:');
    if (value === null) return;
    
    handleStorageChange(key, value);
  };

  const createNotification = () => {
    const title = prompt('Notification title:');
    if (!title) return;
    
    const message = prompt('Notification message:');
    if (message === null) return;
    
    const newNotification = {
      id: Date.now(),
      title,
      message,
      timestamp: new Date().toISOString(),
    };
    
    setNotifications((prev) => [newNotification, ...prev]);
    addApiLog('notifications', `Created notification "${title}"`);
  };

  const addTab = () => {
    const url = prompt('Enter tab URL:', 'https://');
    if (!url) return;
    
    const title = prompt('Enter tab title:') || new URL(url).hostname;
    
    const newTab = {
      id: Math.max(0, ...tabsData.map((t) => t.id)) + 1,
      url,
      title,
      active: false,
    };
    
    setTabsData((prev) => [...prev, newTab]);
    addApiLog('tabs', `Created new tab for ${url}`);
  };

  const activateTab = (tabId: number) => {
    setTabsData((prev) =>
      prev.map((tab) => ({
        ...tab,
        active: tab.id === tabId,
      }))
    );
    addApiLog('tabs', `Activated tab ${tabId}`);
  };

  const removeTab = (tabId: number) => {
    setTabsData((prev) => prev.filter((tab) => tab.id !== tabId));
    addApiLog('tabs', `Removed tab ${tabId}`);
  };

  const togglePermission = (permission: string) => {
    if (permissionsData.includes(permission)) {
      setPermissionsData((prev) => prev.filter((p) => p !== permission));
      addApiLog('permissions', `Removed "${permission}" permission`);
    } else {
      setPermissionsData((prev) => [...prev, permission]);
      addApiLog('permissions', `Added "${permission}" permission`);
    }
  };

  return (
    <div className="h-full flex flex-col border rounded-lg bg-white dark:bg-gray-800">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium">Chrome API Simulator</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Test your extension's interactions with Chrome APIs
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-5 p-1 m-2">
          <TabsTrigger value="storage" className="flex items-center">
            <Database className="h-4 w-4 mr-2" />
            Storage
          </TabsTrigger>
          <TabsTrigger value="tabs" className="flex items-center">
            <Globe className="h-4 w-4 mr-2" />
            Tabs
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            API Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="storage" className="flex-1 p-4 overflow-auto">
          <div className="flex justify-between mb-4">
            <h3 className="text-md font-medium">Storage API</h3>
            <button
              onClick={addStorageItem}
              className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Item
            </button>
          </div>
          
          {Object.keys(storageData).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No storage data. Click "Add Item" to create some.
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(storageData).map(([key, value]) => (
                <div key={key} className="p-3 border rounded-md">
                  <div className="font-medium">{key}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 break-all">
                    {typeof value === 'object'
                      ? JSON.stringify(value)
                      : String(value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tabs" className="flex-1 p-4 overflow-auto">
          <div className="flex justify-between mb-4">
            <h3 className="text-md font-medium">Tabs API</h3>
            <button
              onClick={addTab}
              className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Tab
            </button>
          </div>
          
          <div className="space-y-2">
            {tabsData.map((tab) => (
              <div
                key={tab.id}
                className={`p-3 border rounded-md flex items-center justify-between ${
                  tab.active ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium">{tab.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {tab.url}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!tab.active && (
                    <button
                      onClick={() => activateTab(tab.id)}
                      className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Activate
                    </button>
                  )}
                  <button
                    onClick={() => removeTab(tab.id)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900"
                  >
                    Close
                  </button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="flex-1 p-4 overflow-auto">
          <div className="flex justify-between mb-4">
            <h3 className="text-md font-medium">Notifications API</h3>
            <button
              onClick={createNotification}
              className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create Notification
            </button>
          </div>
          
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No notifications. Click "Create Notification" to create one.
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-3 border rounded-md">
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-sm">{notification.message}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="permissions" className="flex-1 p-4 overflow-auto">
          <h3 className="text-md font-medium mb-4">Permissions API</h3>
          
          <div className="space-y-2">
            {[
              'storage',
              'tabs',
              'activeTab',
              'notifications',
              'cookies',
              'webRequest',
              'webNavigation',
              'history',
              'bookmarks',
              'downloads',
            ].map((permission) => (
              <div
                key={permission}
                className="p-3 border rounded-md flex items-center justify-between"
              >
                <div>{permission}</div>
                <div>
                  <button
                    onClick={() => togglePermission(permission)}
                    className={`px-3 py-1 text-sm rounded ${
                      permissionsData.includes(permission)
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {permissionsData.includes(permission) ? 'Granted' : 'Denied'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="flex-1 p-4 overflow-auto">
          <h3 className="text-md font-medium mb-4">API Logs</h3>
          
          {apiLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No API calls logged yet.
            </div>
          ) : (
            <div className="space-y-2">
              {apiLogs.map((log) => (
                <div key={log.id} className="p-2 border-b text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">chrome.{log.api}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">{log.action}</div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 