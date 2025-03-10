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
  manifest: ChromeManifest;
  onChange: (manifest: ChromeManifest) => void;
  onSave?: () => void;
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
  manifest, 
  onChange,
  onSave
}) => {
  const [editMode, setEditMode] = useState<'visual' | 'json'>('visual');
  const [editedManifest, setEditedManifest] = useState<ChromeManifest>(manifest);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [permissionInfo, setPermissionInfo] = useState<string | null>(null);

  // Initialize manifest with required fields
  useEffect(() => {
    setEditedManifest(manifest);
    validateRequiredFields(manifest);
  }, [manifest]);

  // Validate required manifest fields
  const validateRequiredFields = (manifest: ChromeManifest) => {
    const missing: string[] = [];
    
    // Check required fields according to Chrome Extension Manifest V3
    if (!manifest.manifest_version) missing.push('manifest_version');
    if (!manifest.name) missing.push('name');
    if (!manifest.version) missing.push('version');
    
    setRequiredFields(missing);
  };

  // Handle visual editor field changes
  const handleFieldChange = (field: string, value: any) => {
    const updateNestedField = (obj: any, path: string[], value: any): any => {
      const [current, ...rest] = path;
      
      if (rest.length === 0) {
        return { ...obj, [current]: value };
      }
      
      return {
        ...obj,
        [current]: updateNestedField(obj[current] || {}, rest, value)
      };
    };
    
    const fieldPath = field.split('.');
    const updatedManifest = updateNestedField(editedManifest, fieldPath, value);
    
    setEditedManifest(updatedManifest);
    onChange(updatedManifest);
    validateRequiredFields(updatedManifest);
  };

  // Handle JSON editor changes
  const handleJsonChange = (json: string) => {
    try {
      const parsedManifest = JSON.parse(json);
      setEditedManifest(parsedManifest);
      onChange(parsedManifest);
      validateRequiredFields(parsedManifest);
      setJsonError(null);
    } catch (error) {
      setJsonError((error as Error).message);
    }
  };

  // Add or remove a permission
  const handlePermissionToggle = (permission: string, enabled: boolean) => {
    const currentPermissions = editedManifest.permissions || [];
    let updatedPermissions: string[];
    
    if (enabled) {
      updatedPermissions = [...currentPermissions, permission];
    } else {
      updatedPermissions = currentPermissions.filter(p => p !== permission);
    }
    
    const updatedManifest = {
      ...editedManifest,
      permissions: updatedPermissions
    };
    
    setEditedManifest(updatedManifest);
    onChange(updatedManifest);
  };

  // Show info about a permission
  const showPermissionInfo = (permission: string) => {
    setPermissionInfo(permission);
  };

  // Close permission info modal
  const closePermissionInfo = () => {
    setPermissionInfo(null);
  };

  // Render permission risk level badge
  const renderRiskBadge = (riskLevel: 'low' | 'medium' | 'high') => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[riskLevel]}`}>
        {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
      </span>
    );
  };

  return (
    <div className="manifest-editor">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Manifest Editor</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setEditMode('visual')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              editMode === 'visual' 
                ? 'bg-primary text-white' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Eye size={16} className="inline mr-1" /> Visual Editor
          </button>
          <button
            onClick={() => setEditMode('json')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              editMode === 'json' 
                ? 'bg-primary text-white' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Code size={16} className="inline mr-1" /> JSON Editor
          </button>
        </div>
      </div>
      
      {/* Visual Editor Mode */}
      {editMode === 'visual' && (
        <div className="space-y-6">
          {/* Required Fields Section */}
          <div className="bg-background border border-border rounded-md p-4">
            <h3 className="text-md font-semibold mb-4 flex items-center">
              <Info size={18} className="mr-2 text-primary" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="manifest_version" className="block text-sm font-medium mb-1">
                  Manifest Version <span className="text-red-500">*</span>
                </label>
                <select
                  id="manifest_version"
                  value={editedManifest.manifest_version || 3}
                  onChange={(e) => handleFieldChange('manifest_version', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                >
                  <option value={2}>Version 2</option>
                  <option value={3}>Version 3 (Recommended)</option>
                </select>
                {editedManifest.manifest_version === 2 && (
                  <p className="text-xs text-yellow-500 mt-1 flex items-center">
                    <AlertTriangle size={12} className="mr-1" />
                    Manifest V2 is being deprecated by Google
                  </p>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="version" className="block text-sm font-medium mb-1">
                  Extension Version <span className="text-red-500">*</span>
                </label>
                <input
                  id="version"
                  type="text"
                  value={editedManifest.version || ''}
                  onChange={(e) => handleFieldChange('version', e.target.value)}
                  placeholder="1.0.0"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use semantic versioning (e.g., 1.0.0)
                </p>
              </div>
              
              <div className="form-group md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Extension Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={editedManifest.name || ''}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="My Chrome Extension"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                />
              </div>
              
              <div className="form-group md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={editedManifest.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="Describe what your extension does..."
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm resize-none"
                />
              </div>
            </div>
          </div>
          
          {/* Action Settings Section */}
          <div className="bg-background border border-border rounded-md p-4">
            <h3 className="text-md font-semibold mb-4">Extension Action</h3>
            
            <div className="space-y-4">
              <div className="form-group">
                <label htmlFor="default_popup" className="block text-sm font-medium mb-1">
                  Default Popup
                </label>
                <input
                  id="default_popup"
                  type="text"
                  value={editedManifest.action?.default_popup || ''}
                  onChange={(e) => handleFieldChange('action.default_popup', e.target.value)}
                  placeholder="popup.html"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  HTML file to display when icon is clicked
                </p>
              </div>
              
              <div className="form-group">
                <label htmlFor="default_title" className="block text-sm font-medium mb-1">
                  Default Title
                </label>
                <input
                  id="default_title"
                  type="text"
                  value={editedManifest.action?.default_title || ''}
                  onChange={(e) => handleFieldChange('action.default_title', e.target.value)}
                  placeholder="Hover text for icon"
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                />
              </div>
              
              <div className="form-group">
                <label className="block text-sm font-medium mb-2">
                  Icons
                </label>
                <div className="flex flex-wrap gap-4">
                  {[16, 48, 128].map(size => (
                    <div key={size} className="flex flex-col items-center">
                      <div className="border border-dashed border-border rounded-md w-16 h-16 flex items-center justify-center mb-1">
                        {(editedManifest.icons && editedManifest.icons[size]) ? (
                          <div className="text-xs text-center p-1">
                            <span className="block font-medium mb-1">{size}px</span>
                            <span className="text-primary">Set</span>
                          </div>
                        ) : (
                          <Image size={24} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="text-xs text-center">
                        {size}px Icon
                      </div>
                      <input
                        type="text"
                        value={(editedManifest.icons && editedManifest.icons[size]) || ''}
                        onChange={(e) => {
                          const icons = { ...editedManifest.icons } || {};
                          icons[size] = e.target.value;
                          handleFieldChange('icons', icons);
                        }}
                        placeholder={`icons/icon${size}.png`}
                        className="mt-1 px-2 py-1 w-full text-xs border border-input rounded-md"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Use relative paths from the extension root directory
                </p>
              </div>
            </div>
          </div>
          
          {/* Background Section */}
          <div className="bg-background border border-border rounded-md p-4">
            <h3 className="text-md font-semibold mb-4">Background Service Worker</h3>
            
            <div className="space-y-4">
              <div className="form-group">
                <label className="flex items-center text-sm font-medium mb-2">
                  <input
                    type="checkbox"
                    checked={!!editedManifest.background}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleFieldChange('background', { service_worker: 'background.js' });
                      } else {
                        // Remove the background property
                        const { background, ...restManifest } = editedManifest;
                        setEditedManifest(restManifest);
                        onChange(restManifest);
                      }
                    }}
                    className="mr-2"
                  />
                  Include background script
                </label>
              </div>
              
              {editedManifest.background && (
                <>
                  <div className="form-group">
                    <label htmlFor="service_worker" className="block text-sm font-medium mb-1">
                      Service Worker Script
                    </label>
                    <input
                      id="service_worker"
                      type="text"
                      value={editedManifest.background.service_worker || ''}
                      onChange={(e) => handleFieldChange('background.service_worker', e.target.value)}
                      placeholder="background.js"
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="background_type" className="block text-sm font-medium mb-1">
                      Script Type
                    </label>
                    <select
                      id="background_type"
                      value={editedManifest.background.type || ''}
                      onChange={(e) => handleFieldChange('background.type', e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                    >
                      <option value="">Default</option>
                      <option value="module">Module (ES Modules)</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Permissions Section */}
          <div className="bg-background border border-border rounded-md p-4">
            <h3 className="text-md font-semibold mb-4 flex items-center">
              <Shield size={18} className="mr-2 text-primary" />
              Permissions
            </h3>
            
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-center">
                <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
                Permissions affect user privacy and may impact install rates. Only request what you need.
              </p>
            </div>
            
            <div className="space-y-2">
              {Object.keys(PERMISSION_METADATA).map(permission => {
                const meta = PERMISSION_METADATA[permission];
                const isChecked = editedManifest.permissions?.includes(permission) || false;
                
                return (
                  <div key={permission} className="flex items-center justify-between p-2 border-b border-border">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`perm-${permission}`}
                        checked={isChecked}
                        onChange={(e) => handlePermissionToggle(permission, e.target.checked)}
                        className="mr-3"
                      />
                      <label htmlFor={`perm-${permission}`} className="text-sm font-medium">
                        {meta.name}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      {renderRiskBadge(meta.riskLevel)}
                      <button
                        onClick={() => showPermissionInfo(permission)}
                        className="text-primary hover:text-primary/80"
                        aria-label={`Info about ${meta.name} permission`}
                      >
                        <HelpCircle size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {/* Add custom permission */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">
                  Add Custom Permission
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="customPermission"
                    placeholder="e.g., scripting, webNavigation"
                    className="w-full px-3 py-2 bg-background border border-input rounded-l-md text-sm"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('customPermission') as HTMLInputElement;
                      if (input.value.trim()) {
                        handlePermissionToggle(input.value.trim(), true);
                        input.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-primary text-white rounded-r-md text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content Scripts Section */}
          <div className="bg-background border border-border rounded-md p-4">
            <h3 className="text-md font-semibold mb-4">Content Scripts</h3>
            
            <div className="space-y-4">
              <div className="form-group">
                <label className="flex items-center text-sm font-medium mb-2">
                  <input
                    type="checkbox"
                    checked={!!editedManifest.content_scripts && editedManifest.content_scripts.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleFieldChange('content_scripts', [{
                          matches: ['<all_urls>'],
                          js: ['content.js'],
                          css: []
                        }]);
                      } else {
                        // Remove the content_scripts property
                        const { content_scripts, ...restManifest } = editedManifest;
                        setEditedManifest(restManifest);
                        onChange(restManifest);
                      }
                    }}
                    className="mr-2"
                  />
                  Include content scripts
                </label>
                <p className="text-xs text-muted-foreground ml-6">
                  Content scripts run in the context of web pages
                </p>
              </div>
              
              {editedManifest.content_scripts && editedManifest.content_scripts.length > 0 && (
                <div className="border border-border rounded-md p-3">
                  <div className="form-group mb-3">
                    <label htmlFor="content_matches" className="block text-sm font-medium mb-1">
                      URL Patterns to Match
                    </label>
                    <input
                      id="content_matches"
                      type="text"
                      value={editedManifest.content_scripts[0].matches.join(', ')}
                      onChange={(e) => {
                        const matches = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        const updatedContentScripts = [...editedManifest.content_scripts || []];
                        updatedContentScripts[0] = {
                          ...updatedContentScripts[0],
                          matches
                        };
                        handleFieldChange('content_scripts', updatedContentScripts);
                      }}
                      placeholder="<all_urls>, https://*.example.com/*"
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Comma-separated list of URL patterns (use <code>&lt;all_urls&gt;</code> for all websites)
                    </p>
                  </div>
                  
                  <div className="form-group mb-3">
                    <label htmlFor="content_js" className="block text-sm font-medium mb-1">
                      JavaScript Files
                    </label>
                    <input
                      id="content_js"
                      type="text"
                      value={(editedManifest.content_scripts[0].js || []).join(', ')}
                      onChange={(e) => {
                        const js = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        const updatedContentScripts = [...editedManifest.content_scripts || []];
                        updatedContentScripts[0] = {
                          ...updatedContentScripts[0],
                          js
                        };
                        handleFieldChange('content_scripts', updatedContentScripts);
                      }}
                      placeholder="content.js, utils.js"
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                    />
                  </div>
                  
                  <div className="form-group mb-3">
                    <label htmlFor="content_css" className="block text-sm font-medium mb-1">
                      CSS Files
                    </label>
                    <input
                      id="content_css"
                      type="text"
                      value={(editedManifest.content_scripts[0].css || []).join(', ')}
                      onChange={(e) => {
                        const css = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        const updatedContentScripts = [...editedManifest.content_scripts || []];
                        updatedContentScripts[0] = {
                          ...updatedContentScripts[0],
                          css
                        };
                        handleFieldChange('content_scripts', updatedContentScripts);
                      }}
                      placeholder="content.css, styles.css"
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="run_at" className="block text-sm font-medium mb-1">
                      Run Time
                    </label>
                    <select
                      id="run_at"
                      value={editedManifest.content_scripts[0].run_at || 'document_idle'}
                      onChange={(e) => {
                        const updatedContentScripts = [...editedManifest.content_scripts || []];
                        updatedContentScripts[0] = {
                          ...updatedContentScripts[0],
                          run_at: e.target.value
                        };
                        handleFieldChange('content_scripts', updatedContentScripts);
                      }}
                      className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                    >
                      <option value="document_idle">Document Idle (Default)</option>
                      <option value="document_start">Document Start</option>
                      <option value="document_end">Document End</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Options Page Section */}
          <div className="bg-background border border-border rounded-md p-4">
            <h3 className="text-md font-semibold mb-4">Options Page</h3>
            
            <div className="space-y-4">
              <div className="form-group">
                <label className="flex items-center text-sm font-medium mb-2">
                  <input
                    type="checkbox"
                    checked={!!editedManifest.options_page}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleFieldChange('options_page', 'options.html');
                      } else {
                        // Remove the options_page property
                        const { options_page, ...restManifest } = editedManifest;
                        setEditedManifest(restManifest);
                        onChange(restManifest);
                      }
                    }}
                    className="mr-2"
                  />
                  Include options page
                </label>
                <p className="text-xs text-muted-foreground ml-6">
                  A page for extension settings and preferences
                </p>
              </div>
              
              {editedManifest.options_page && (
                <div className="form-group">
                  <label htmlFor="options_page" className="block text-sm font-medium mb-1">
                    Options Page File
                  </label>
                  <input
                    id="options_page"
                    type="text"
                    value={editedManifest.options_page || ''}
                    onChange={(e) => handleFieldChange('options_page', e.target.value)}
                    placeholder="options.html"
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Host Permissions Section */}
          <div className="bg-background border border-border rounded-md p-4">
            <h3 className="text-md font-semibold mb-4 flex items-center">
              <Lock size={18} className="mr-2 text-primary" />
              Host Permissions
            </h3>
            
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-center">
                <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
                Host permissions give access to specific URLs. Users will be prompted to approve these.
              </p>
            </div>
            
            <div className="form-group">
              <label htmlFor="host_permissions" className="block text-sm font-medium mb-1">
                URL Patterns
              </label>
              <textarea
                id="host_permissions"
                value={(editedManifest.host_permissions || []).join('\n')}
                onChange={(e) => {
                  const hostPermissions = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
                  handleFieldChange('host_permissions', hostPermissions);
                }}
                placeholder="https://*.example.com/*&#10;https://api.example.org/*&#10;<all_urls>"
                rows={3}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter one URL pattern per line. Use <code>&lt;all_urls&gt;</code> for access to all websites.
              </p>
            </div>
          </div>
          
          {/* Advanced Fields Section */}
          <div className="bg-background border border-border rounded-md p-4">
            <h3 className="text-md font-semibold mb-4 flex items-center">
              <Code size={18} className="mr-2 text-primary" />
              Advanced Fields
            </h3>
            
            <div className="form-group">
              <button
                onClick={() => setEditMode('json')}
                className="px-3 py-2 rounded-md text-sm font-medium bg-muted text-primary hover:bg-muted/80"
              >
                Edit Raw JSON
              </button>
              <p className="text-xs text-muted-foreground mt-1">
                For advanced configuration options or custom fields, use the JSON editor
              </p>
            </div>
          </div>
          
          {/* Validation Errors */}
          {requiredFields.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                Missing Required Fields:
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-400 list-disc list-inside">
                {requiredFields.map(field => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* JSON Editor Mode */}
      {editMode === 'json' && (
        <div>
          <CodeEditor
            value={JSON.stringify(editedManifest, null, 2)}
            language="json"
            onChange={handleJsonChange}
            height="500px"
          />
          
          {jsonError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-300">
                <strong>JSON Error:</strong> {jsonError}
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Permission Info Modal */}
      {permissionInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{PERMISSION_METADATA[permissionInfo].name} Permission</h3>
              <button 
                onClick={closePermissionInfo}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            
            <div className="mb-4">
              {renderRiskBadge(PERMISSION_METADATA[permissionInfo].riskLevel)}
            </div>
            
            <p className="text-sm mb-4">
              {PERMISSION_METADATA[permissionInfo].description}
            </p>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Common Uses:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                {PERMISSION_METADATA[permissionInfo].examples.map((example, index) => (
                  <li key={index}>{example}</li>
                ))}
              </ul>
            </div>
            
            <div className="pt-4 border-t border-border flex justify-end">
              <a 
                href={PERMISSION_METADATA[permissionInfo].url} 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline mr-4"
              >
                View Documentation
              </a>
              <button
                onClick={closePermissionInfo}
                className="px-3 py-2 bg-primary text-white rounded-md text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Save Button */}
      {onSave && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onSave}
            disabled={requiredFields.length > 0 || !!jsonError}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              requiredFields.length > 0 || !!jsonError
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            Save Manifest
          </button>
        </div>
      )}
    </div>
  );
};

export default ManifestEditor;