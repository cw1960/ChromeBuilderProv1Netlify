import React, { useState, useEffect } from 'react';
import { ChromeManifest } from '@/lib/supabase-mcp';
import { CodeEditor } from './';
import { 
  Info, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  HelpCircle,
  Shield,
  Eye,
  Code,
  Image
} from 'lucide-react';

interface ManifestEditorProps {
  value: string;
  onChange: (value: string) => void;
}

// Permission metadata for more user-friendly display and explanations
interface PermissionMetadata {
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  url: string;
  examples: string[];
}

const PERMISSION_METADATA: Record<string, PermissionMetadata> = {
  'activeTab': {
    name: 'Active Tab',
    description: 'Access details about the currently active tab',
    riskLevel: 'low',
    url: 'https://developer.chrome.com/docs/extensions/reference/activeTab/',
    examples: ['Read the URL of the current page', 'Execute scripts on the current page']
  },
  'tabs': {
    name: 'Tabs',
    description: 'Interact with the browser\'s tab system',
    riskLevel: 'medium',
    url: 'https://developer.chrome.com/docs/extensions/reference/tabs/',
    examples: ['Create, modify, and rearrange tabs', 'Access tab URLs and content']
  },
  'storage': {
    name: 'Storage',
    description: 'Store and retrieve data in browser storage',
    riskLevel: 'low',
    url: 'https://developer.chrome.com/docs/extensions/reference/storage/',
    examples: ['Save user preferences', 'Cache data for offline use']
  },
  'alarms': {
    name: 'Alarms',
    description: 'Schedule code to run at specific times',
    riskLevel: 'low',
    url: 'https://developer.chrome.com/docs/extensions/reference/alarms/',
    examples: ['Periodic background tasks', 'Delayed operations']
  },
  'contextMenus': {
    name: 'Context Menus',
    description: 'Add items to the browser\'s context menu',
    riskLevel: 'low',
    url: 'https://developer.chrome.com/docs/extensions/reference/contextMenus/',
    examples: ['Add custom right-click options', 'Create context-sensitive actions']
  },
  'notifications': {
    name: 'Notifications',
    description: 'Display notifications to the user',
    riskLevel: 'low',
    url: 'https://developer.chrome.com/docs/extensions/reference/notifications/',
    examples: ['Alert users about important events', 'Display status updates']
  },
  'webRequest': {
    name: 'Web Request',
    description: 'Observe and analyze traffic',
    riskLevel: 'high',
    url: 'https://developer.chrome.com/docs/extensions/reference/webRequest/',
    examples: ['Monitor network requests', 'Modify request headers']
  },
  'webRequestBlocking': {
    name: 'Web Request Blocking',
    description: 'Block or modify network requests',
    riskLevel: 'high',
    url: 'https://developer.chrome.com/docs/extensions/reference/webRequest/',
    examples: ['Block ads or trackers', 'Redirect requests to different servers']
  },
  'cookies': {
    name: 'Cookies',
    description: 'Read and modify browser cookies',
    riskLevel: 'high',
    url: 'https://developer.chrome.com/docs/extensions/reference/cookies/',
    examples: ['Read authentication cookies', 'Modify session data']
  },
  'history': {
    name: 'History',
    description: 'Access the user\'s browsing history',
    riskLevel: 'high',
    url: 'https://developer.chrome.com/docs/extensions/reference/history/',
    examples: ['Analyze browsing patterns', 'Add or remove history entries']
  },
  'bookmarks': {
    name: 'Bookmarks',
    description: 'Create, organize, and manipulate bookmarks',
    riskLevel: 'medium',
    url: 'https://developer.chrome.com/docs/extensions/reference/bookmarks/',
    examples: ['Create bookmark folders', 'Manage bookmarked pages']
  },
  'downloads': {
    name: 'Downloads',
    description: 'Manage file downloads',
    riskLevel: 'medium',
    url: 'https://developer.chrome.com/docs/extensions/reference/downloads/',
    examples: ['Start downloads programmatically', 'Track download progress']
  },
  'theme': {
    name: 'Theme',
    description: 'Change the browser\'s visual theme',
    riskLevel: 'low',
    url: 'https://developer.chrome.com/docs/extensions/reference/theme/',
    examples: ['Apply custom color schemes', 'Modify browser appearance']
  }
};

const ManifestEditor: React.FC<ManifestEditorProps> = ({ 
  value,
  onChange
}) => {
  return (
    <div className="w-full h-[500px] border border-border rounded-md overflow-hidden">
      <CodeEditor
        value={value}
        onChange={onChange}
        language="json"
        height="100%"
      />
    </div>
  );
};

export { ManifestEditor };