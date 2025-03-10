// Mock Chrome API Types

// Storage
export interface StorageArea {
  get: (keys: string | string[] | object | null, callback: (items: object) => void) => void;
  set: (items: object, callback?: () => void) => void;
  remove: (keys: string | string[], callback?: () => void) => void;
  clear: (callback?: () => void) => void;
  onChanged?: {
    addListener: (callback: (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => void) => void;
    removeListener: (callback: Function) => void;
  };
}

export interface StorageChange {
  oldValue?: any;
  newValue?: any;
}

export interface StorageMock {
  local: StorageArea;
  sync: StorageArea;
  session: StorageArea;
  onChanged: {
    addListener: (callback: (changes: { [key: string]: StorageChange }, areaName: string) => void) => void;
    removeListener: (callback: Function) => void;
    hasListeners: () => boolean;
  };
}

// Runtime
export interface RuntimeMessage {
  id?: string;
  data: any;
  sender?: MessageSender;
}

export interface MessageSender {
  tab?: chrome.tabs.Tab;
  frameId?: number;
  id?: string;
  url?: string;
  origin?: string;
}

export interface RuntimeMock {
  sendMessage: (message: any, callback?: (response?: any) => void) => void;
  onMessage: {
    addListener: (callback: (message: any, sender: MessageSender, sendResponse: (response?: any) => void) => void) => void;
    removeListener: (callback: Function) => void;
    hasListeners: () => boolean;
  };
  getManifest: () => chrome.runtime.Manifest;
  id: string;
  getURL: (path: string) => string;
  lastError?: { message: string };
}

// Tabs
export interface Tab {
  id: number;
  index: number;
  windowId: number;
  highlighted: boolean;
  active: boolean;
  pinned: boolean;
  url?: string;
  title?: string;
  favIconUrl?: string;
  status?: string;
  incognito: boolean;
  audible?: boolean;
  width?: number;
  height?: number;
  sessionId?: string;
}

export interface UpdateProperties {
  url?: string;
  active?: boolean;
  highlighted?: boolean;
  pinned?: boolean;
  muted?: boolean;
  autoDiscardable?: boolean;
  [key: string]: any;
}

export interface CreateProperties {
  url?: string;
  active?: boolean;
  index?: number;
  pinned?: boolean;
  windowId?: number;
  [key: string]: any;
}

export interface QueryInfo {
  active?: boolean;
  audible?: boolean;
  currentWindow?: boolean;
  highlighted?: boolean;
  index?: number;
  muted?: boolean;
  pinned?: boolean;
  status?: string;
  title?: string;
  url?: string | string[];
  windowId?: number;
  windowType?: string;
  [key: string]: any;
}

export interface TabsUpdateInfo {
  status?: string;
  url?: string;
  pinned?: boolean;
  audible?: boolean;
  discarded?: boolean;
  autoDiscardable?: boolean;
  mutedInfo?: any;
  favIconUrl?: string;
  title?: string;
}

export interface TabsMock {
  query: (queryInfo: QueryInfo, callback: (tabs: Tab[]) => void) => void;
  create: (createProperties: CreateProperties, callback?: (tab: Tab) => void) => void;
  update: (tabId: number, updateProperties: UpdateProperties, callback?: (tab?: Tab) => void) => void;
  remove: (tabIds: number | number[], callback?: () => void) => void;
  get: (tabId: number, callback: (tab: Tab) => void) => void;
  getCurrent: (callback: (tab?: Tab) => void) => void;
  sendMessage: (tabId: number, message: any, options?: any, callback?: (response: any) => void) => void;
  onCreated: {
    addListener: (callback: (tab: Tab) => void) => void;
    removeListener: (callback: Function) => void;
    hasListeners: () => boolean;
  };
  onUpdated: {
    addListener: (callback: (tabId: number, changeInfo: TabsUpdateInfo, tab: Tab) => void) => void;
    removeListener: (callback: Function) => void;
    hasListeners: () => boolean;
  };
  onRemoved: {
    addListener: (callback: (tabId: number, removeInfo: { windowId: number, isWindowClosing: boolean }) => void) => void;
    removeListener: (callback: Function) => void;
    hasListeners: () => boolean;
  };
}

// Permissions
export interface PermissionsMock {
  request: (permissions: { origins?: string[], permissions?: string[] }, callback?: (granted: boolean) => void) => void;
  contains: (permissions: { origins?: string[], permissions?: string[] }, callback: (result: boolean) => void) => void;
  getAll: (callback: (permissions: { origins: string[], permissions: string[] }) => void) => void;
  remove: (permissions: { origins?: string[], permissions?: string[] }, callback?: (removed: boolean) => void) => void;
  onAdded: {
    addListener: (callback: (permissions: { origins: string[], permissions: string[] }) => void) => void;
    removeListener: (callback: Function) => void;
    hasListeners: () => boolean;
  };
  onRemoved: {
    addListener: (callback: (permissions: { origins: string[], permissions: string[] }) => void) => void;
    removeListener: (callback: Function) => void;
    hasListeners: () => boolean;
  };
}

// Notifications
export interface NotificationOptions {
  type: 'basic' | 'image' | 'list' | 'progress';
  iconUrl?: string;
  appIconMaskUrl?: string;
  title: string;
  message: string;
  contextMessage?: string;
  priority?: number;
  eventTime?: number;
  buttons?: { title: string; iconUrl?: string }[];
  imageUrl?: string;
  items?: { title: string; message: string }[];
  progress?: number;
  requireInteraction?: boolean;
  silent?: boolean;
  [key: string]: any;
}

export interface NotificationsMock {
  create: (notificationId: string | undefined, options: NotificationOptions, callback?: (notificationId: string) => void) => void;
  update: (notificationId: string, options: NotificationOptions, callback?: (wasUpdated: boolean) => void) => void;
  clear: (notificationId: string, callback?: (wasCleared: boolean) => void) => void;
  getAll: (callback: (notifications: { [key: string]: NotificationOptions }) => void) => void;
  onClicked: {
    addListener: (callback: (notificationId: string) => void) => void;
    removeListener: (callback: Function) => void;
    hasListeners: () => boolean;
  };
  onButtonClicked: {
    addListener: (callback: (notificationId: string, buttonIndex: number) => void) => void;
    removeListener: (callback: Function) => void;
    hasListeners: () => boolean;
  };
  onClosed: {
    addListener: (callback: (notificationId: string, byUser: boolean) => void) => void;
    removeListener: (callback: Function) => void;
    hasListeners: () => boolean;
  };
}

// Combined Chrome API Mock Interface
export interface ChromeApiMocks {
  storage: StorageMock;
  runtime: RuntimeMock;
  tabs: TabsMock;
  permissions: PermissionsMock;
  notifications: NotificationsMock;
}