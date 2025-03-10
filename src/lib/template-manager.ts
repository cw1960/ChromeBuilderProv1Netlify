import { ProjectContext, ChromeManifest, ProjectFile, ProjectFileType } from './supabase-mcp';

export interface ExtensionTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  difficulty: TemplateDifficulty;
  manifest: ChromeManifest;
  files: ProjectFile[];
  screenshot?: string;
  usageCount: number;
  tags: string[];
}

export enum TemplateCategory {
  Productivity = 'productivity',
  Developer = 'developer',
  Social = 'social',
  Ecommerce = 'ecommerce',
  Entertainment = 'entertainment',
  Utility = 'utility'
}

export enum TemplateDifficulty {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced'
}

// Create a project from a template
export function createProjectFromTemplate(
  templateId: string,
  name: string,
  description: string
): ProjectContext | null {
  const template = getTemplateById(templateId);
  
  if (!template) {
    return null;
  }
  
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  // Clone the manifest and update name/description
  const manifest = { ...template.manifest };
  manifest.name = name;
  manifest.description = description;
  
  // Update usage count
  updateTemplateUsageCount(templateId);
  
  return {
    id,
    name,
    description,
    version: '0.1.0',
    created_at: timestamp,
    updated_at: timestamp,
    manifest,
    files: JSON.parse(JSON.stringify(template.files)), // Deep clone files
    settings: {
      template_id: templateId,
      theme: 'dark',
      auto_save: true,
    },
    deployment_history: [],
  };
}

// Get a template by its ID
export function getTemplateById(templateId: string): ExtensionTemplate | undefined {
  return EXTENSION_TEMPLATES.find(template => template.id === templateId);
}

// Get all templates
export function getAllTemplates(): ExtensionTemplate[] {
  return EXTENSION_TEMPLATES;
}

// Get templates by category
export function getTemplatesByCategory(category: TemplateCategory): ExtensionTemplate[] {
  return EXTENSION_TEMPLATES.filter(template => template.category === category);
}

// Get templates by difficulty
export function getTemplatesByDifficulty(difficulty: TemplateDifficulty): ExtensionTemplate[] {
  return EXTENSION_TEMPLATES.filter(template => template.difficulty === difficulty);
}

// Filter templates by search term
export function searchTemplates(query: string): ExtensionTemplate[] {
  const lowerQuery = query.toLowerCase();
  return EXTENSION_TEMPLATES.filter(template => 
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

// Update template usage count
function updateTemplateUsageCount(templateId: string): void {
  const template = EXTENSION_TEMPLATES.find(t => t.id === templateId);
  if (template) {
    template.usageCount++;
  }
}

// Standard empty.html file for templates that include HTML files
const emptyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chrome Extension</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app"></div>
  <script src="popup.js"></script>
</body>
</html>`;

// Standard empty.css file for templates that include CSS files
const emptyCss = `body {
  font-family: Arial, sans-serif;
  width: 300px;
  padding: 10px;
  margin: 0;
}

#app {
  display: flex;
  flex-direction: column;
  align-items: center;
}`;

// Define templates
export const EXTENSION_TEMPLATES: ExtensionTemplate[] = [
  // Simple Popup Template
  {
    id: 'simple-popup',
    name: 'Simple Popup',
    description: 'A basic extension with a popup interface. Great starting point for most extensions.',
    category: TemplateCategory.Utility,
    difficulty: TemplateDifficulty.Beginner,
    manifest: {
      manifest_version: 3,
      name: 'Simple Popup Extension',
      version: '1.0.0',
      description: 'A simple extension with a popup interface',
      action: {
        default_popup: 'popup.html',
        default_icon: {
          '16': 'icons/icon16.png',
          '48': 'icons/icon48.png',
          '128': 'icons/icon128.png'
        }
      },
      icons: {
        '16': 'icons/icon16.png',
        '48': 'icons/icon48.png',
        '128': 'icons/icon128.png'
      },
      permissions: ['storage']
    },
    files: [
      {
        id: crypto.randomUUID(),
        name: 'popup.html',
        path: 'popup.html',
        type: ProjectFileType.HTML,
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simple Popup Extension</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <h1>My Extension</h1>
    <p>This is a simple popup extension.</p>
    <button id="actionButton">Click Me</button>
    <div id="result"></div>
  </div>
  <script src="popup.js"></script>
</body>
</html>`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'styles.css',
        path: 'styles.css',
        type: ProjectFileType.CSS,
        content: `body {
  font-family: Arial, sans-serif;
  width: 300px;
  padding: 15px;
  margin: 0;
}

#app {
  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  font-size: 18px;
  margin-bottom: 10px;
}

button {
  background-color: #4285f4;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin: 10px 0;
}

button:hover {
  background-color: #3367d6;
}

#result {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
  min-height: 20px;
}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'popup.js',
        path: 'popup.js',
        type: ProjectFileType.JAVASCRIPT,
        content: `// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get references to DOM elements
  const actionButton = document.getElementById('actionButton');
  const resultDiv = document.getElementById('result');
  
  // Load any saved data from storage
  chrome.storage.local.get(['lastClicked'], function(result) {
    if (result.lastClicked) {
      resultDiv.textContent = 'Last clicked: ' + new Date(result.lastClicked).toLocaleString();
    }
  });
  
  // Add click event listener to the button
  actionButton.addEventListener('click', function() {
    const now = new Date().getTime();
    
    // Save the click time to storage
    chrome.storage.local.set({ 'lastClicked': now }, function() {
      resultDiv.textContent = 'Last clicked: ' + new Date(now).toLocaleString();
    });
  });
});`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    usageCount: 0,
    tags: ['popup', 'basic', 'beginner', 'storage']
  },
  
  // Content Script Template
  {
    id: 'content-script',
    name: 'Content Script Extension',
    description: 'An extension that modifies web pages using content scripts.',
    category: TemplateCategory.Developer,
    difficulty: TemplateDifficulty.Intermediate,
    manifest: {
      manifest_version: 3,
      name: 'Content Script Extension',
      version: '1.0.0',
      description: 'Modifies web pages using content scripts',
      action: {
        default_popup: 'popup.html',
        default_icon: {
          '16': 'icons/icon16.png',
          '48': 'icons/icon48.png',
          '128': 'icons/icon128.png'
        }
      },
      icons: {
        '16': 'icons/icon16.png',
        '48': 'icons/icon48.png',
        '128': 'icons/icon128.png'
      },
      content_scripts: [
        {
          matches: ['<all_urls>'],
          js: ['content.js'],
          css: ['content.css']
        }
      ],
      permissions: ['storage', 'activeTab']
    },
    files: [
      {
        id: crypto.randomUUID(),
        name: 'popup.html',
        path: 'popup.html',
        type: ProjectFileType.HTML,
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Content Script Extension</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <h1>Content Script Settings</h1>
    <div class="form-group">
      <label for="enableExtension">
        <input type="checkbox" id="enableExtension" checked>
        Enable content script
      </label>
    </div>
    <div class="form-group">
      <label for="textColor">Text Color:</label>
      <input type="color" id="textColor" value="#0000ff">
    </div>
    <button id="saveButton">Save Settings</button>
    <div id="status"></div>
  </div>
  <script src="popup.js"></script>
</body>
</html>`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'styles.css',
        path: 'styles.css',
        type: ProjectFileType.CSS,
        content: `body {
  font-family: Arial, sans-serif;
  width: 300px;
  padding: 15px;
  margin: 0;
}

#app {
  display: flex;
  flex-direction: column;
}

h1 {
  font-size: 18px;
  margin-bottom: 15px;
}

.form-group {
  margin-bottom: 12px;
}

label {
  display: block;
  margin-bottom: 5px;
}

button {
  background-color: #4285f4;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

button:hover {
  background-color: #3367d6;
}

#status {
  margin-top: 10px;
  padding: 8px;
  border-radius: 4px;
  text-align: center;
}

.success {
  background-color: #d4edda;
  color: #155724;
}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'popup.js',
        path: 'popup.js',
        type: ProjectFileType.JAVASCRIPT,
        content: `// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get references to DOM elements
  const enableCheckbox = document.getElementById('enableExtension');
  const textColorInput = document.getElementById('textColor');
  const saveButton = document.getElementById('saveButton');
  const statusDiv = document.getElementById('status');
  
  // Load saved settings
  chrome.storage.sync.get(
    { 
      enabled: true, 
      textColor: '#0000ff' 
    }, 
    function(items) {
      enableCheckbox.checked = items.enabled;
      textColorInput.value = items.textColor;
    }
  );
  
  // Save settings when button is clicked
  saveButton.addEventListener('click', function() {
    const settings = {
      enabled: enableCheckbox.checked,
      textColor: textColorInput.value
    };
    
    // Save to storage
    chrome.storage.sync.set(settings, function() {
      // Show success message
      statusDiv.textContent = 'Settings saved!';
      statusDiv.className = 'success';
      
      // Clear message after 2 seconds
      setTimeout(function() {
        statusDiv.textContent = '';
        statusDiv.className = '';
      }, 2000);
    });
  });
});`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'content.js',
        path: 'content.js',
        type: ProjectFileType.JAVASCRIPT,
        content: `// Function to modify the page based on settings
function modifyPage(settings) {
  if (!settings.enabled) {
    return;
  }
  
  // Find all paragraphs and modify them
  const paragraphs = document.querySelectorAll('p');
  paragraphs.forEach(p => {
    // Apply text color
    p.style.color = settings.textColor;
    
    // Add a modification class for CSS to target
    p.classList.add('extension-modified');
  });
  
  // Create a floating indicator to show the extension is active
  const indicator = document.createElement('div');
  indicator.className = 'extension-indicator';
  indicator.textContent = 'Content Script Active';
  document.body.appendChild(indicator);
}

// Get settings and apply modifications
chrome.storage.sync.get(
  { 
    enabled: true, 
    textColor: '#0000ff' 
  }, 
  function(settings) {
    // Apply modifications with current settings
    modifyPage(settings);
    
    // Listen for settings changes
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      if (namespace === 'sync') {
        // Update settings with any changed values
        if (changes.enabled) {
          settings.enabled = changes.enabled.newValue;
        }
        if (changes.textColor) {
          settings.textColor = changes.textColor.newValue;
        }
        
        // Apply changes by reloading the page
        location.reload();
      }
    });
  }
);`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'content.css',
        path: 'content.css',
        type: ProjectFileType.CSS,
        content: `.extension-modified {
  font-weight: bold;
  text-decoration: underline;
}

.extension-indicator {
  position: fixed;
  bottom: 10px;
  right: 10px;
  background-color: rgba(66, 133, 244, 0.8);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-family: Arial, sans-serif;
  font-size: 12px;
  z-index: 9999;
}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    usageCount: 0,
    tags: ['content script', 'web page', 'customize', 'DOM manipulation']
  },
  
  // Background Service Worker Template
  {
    id: 'background-worker',
    name: 'Background Service Worker',
    description: 'Extension with a background service worker for running tasks in the background.',
    category: TemplateCategory.Developer,
    difficulty: TemplateDifficulty.Advanced,
    manifest: {
      manifest_version: 3,
      name: 'Background Service Worker Extension',
      version: '1.0.0',
      description: 'Runs tasks in the background using a service worker',
      action: {
        default_popup: 'popup.html',
        default_icon: {
          '16': 'icons/icon16.png',
          '48': 'icons/icon48.png',
          '128': 'icons/icon128.png'
        }
      },
      icons: {
        '16': 'icons/icon16.png',
        '48': 'icons/icon48.png',
        '128': 'icons/icon128.png'
      },
      background: {
        service_worker: 'background.js',
        type: 'module'
      },
      permissions: ['alarms', 'storage', 'notifications']
    },
    files: [
      {
        id: crypto.randomUUID(),
        name: 'popup.html',
        path: 'popup.html',
        type: ProjectFileType.HTML,
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Background Worker Extension</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <h1>Background Tasks</h1>
    
    <div class="section">
      <h2>Alarm Settings</h2>
      <div class="form-group">
        <label for="alarmInterval">Interval (minutes):</label>
        <input type="number" id="alarmInterval" min="1" max="60" value="15">
      </div>
      <div class="form-group">
        <label for="enableNotifications">
          <input type="checkbox" id="enableNotifications" checked>
          Enable notifications
        </label>
      </div>
      <button id="saveSettings">Save Settings</button>
      <button id="testAlarm">Test Alarm Now</button>
    </div>
    
    <div class="section">
      <h2>Activity Log</h2>
      <div id="activityLog" class="log-container">
        <div class="log-entry">No activity recorded yet.</div>
      </div>
      <button id="clearLog">Clear Log</button>
    </div>
    
    <div id="status"></div>
  </div>
  <script src="popup.js"></script>
</body>
</html>`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'styles.css',
        path: 'styles.css',
        type: ProjectFileType.CSS,
        content: `body {
  font-family: Arial, sans-serif;
  width: 350px;
  padding: 15px;
  margin: 0;
}

#app {
  display: flex;
  flex-direction: column;
}

h1 {
  font-size: 20px;
  margin-bottom: 15px;
}

h2 {
  font-size: 16px;
  margin-bottom: 10px;
}

.section {
  margin-bottom: 20px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.form-group {
  margin-bottom: 12px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input[type="number"] {
  width: 60px;
  padding: 4px;
}

button {
  background-color: #4285f4;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  margin-right: 8px;
}

button:hover {
  background-color: #3367d6;
}

.log-container {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  background-color: white;
}

.log-entry {
  padding: 4px 0;
  border-bottom: 1px solid #eee;
  font-size: 12px;
}

.log-entry:last-child {
  border-bottom: none;
}

#status {
  margin-top: 10px;
  padding: 8px;
  border-radius: 4px;
  text-align: center;
}

.success {
  background-color: #d4edda;
  color: #155724;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'popup.js',
        path: 'popup.js',
        type: ProjectFileType.JAVASCRIPT,
        content: `// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get references to DOM elements
  const alarmIntervalInput = document.getElementById('alarmInterval');
  const enableNotificationsCheckbox = document.getElementById('enableNotifications');
  const saveSettingsButton = document.getElementById('saveSettings');
  const testAlarmButton = document.getElementById('testAlarm');
  const clearLogButton = document.getElementById('clearLog');
  const activityLogDiv = document.getElementById('activityLog');
  const statusDiv = document.getElementById('status');
  
  // Load saved settings
  chrome.storage.sync.get(
    { 
      alarmInterval: 15, 
      enableNotifications: true 
    }, 
    function(items) {
      alarmIntervalInput.value = items.alarmInterval;
      enableNotificationsCheckbox.checked = items.enableNotifications;
    }
  );
  
  // Load activity log
  loadActivityLog();
  
  // Save settings when button is clicked
  saveSettingsButton.addEventListener('click', function() {
    const interval = parseInt(alarmIntervalInput.value, 10);
    
    if (interval < 1 || interval > 60) {
      showStatus('Interval must be between 1 and 60 minutes', 'error');
      return;
    }
    
    const settings = {
      alarmInterval: interval,
      enableNotifications: enableNotificationsCheckbox.checked
    };
    
    // Save to storage
    chrome.storage.sync.set(settings, function() {
      // Show success message
      showStatus('Settings saved!', 'success');
      
      // Send message to background service worker to update alarm
      chrome.runtime.sendMessage({ action: 'updateAlarm', interval: interval });
    });
  });
  
  // Test alarm when button is clicked
  testAlarmButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'testAlarm' }, function(response) {
      if (response && response.success) {
        showStatus('Alarm triggered!', 'success');
        
        // Reload activity log to show the new entry
        setTimeout(loadActivityLog, 500);
      } else {
        showStatus('Failed to trigger alarm', 'error');
      }
    });
  });
  
  // Clear log when button is clicked
  clearLogButton.addEventListener('click', function() {
    chrome.storage.local.set({ activityLog: [] }, function() {
      loadActivityLog();
      showStatus('Log cleared', 'success');
    });
  });
  
  // Show status message
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
    
    // Clear message after 2 seconds
    setTimeout(function() {
      statusDiv.textContent = '';
      statusDiv.className = '';
    }, 2000);
  }
  
  // Load activity log
  function loadActivityLog() {
    chrome.storage.local.get({ activityLog: [] }, function(result) {
      if (result.activityLog.length === 0) {
        activityLogDiv.innerHTML = '<div class="log-entry">No activity recorded yet.</div>';
        return;
      }
      
      // Display the most recent entries first (up to 10)
      const entries = result.activityLog.slice(-10).reverse();
      
      activityLogDiv.innerHTML = entries.map(entry => {
        const date = new Date(entry.timestamp);
        return \`<div class="log-entry">
          <strong>\${formatTime(date)}</strong>: \${entry.message}
        </div>\`;
      }).join('');
    });
  }
  
  // Format time for display
  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
           ' ' + date.toLocaleDateString();
  }
});`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'background.js',
        path: 'background.js',
        type: ProjectFileType.JAVASCRIPT,
        content: `// Initialize when the extension is installed or updated
chrome.runtime.onInstalled.addListener(function() {
  console.log('Background service worker installed.');
  
  // Initialize settings if not set
  chrome.storage.sync.get(
    { 
      alarmInterval: 15, 
      enableNotifications: true 
    }, 
    function(items) {
      // Create the initial alarm
      createAlarm(items.alarmInterval);
      
      // Initialize activity log if it doesn't exist
      chrome.storage.local.get({ activityLog: null }, function(result) {
        if (result.activityLog === null) {
          chrome.storage.local.set({ activityLog: [] });
        }
      });
      
      // Log the installation
      logActivity('Extension installed. Alarm set for every ' + items.alarmInterval + ' minutes.');
    }
  );
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('Background received message:', message);
  
  if (message.action === 'updateAlarm') {
    createAlarm(message.interval);
    logActivity('Alarm interval updated to ' + message.interval + ' minutes.');
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'testAlarm') {
    // Run the alarm task immediately
    performAlarmTask();
    sendResponse({ success: true });
    return true;
  }
});

// Handle the alarm event
chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'backgroundTask') {
    performAlarmTask();
  }
});

// Create or update the alarm
function createAlarm(intervalMinutes) {
  // Clear any existing alarm
  chrome.alarms.clear('backgroundTask', function() {
    // Create a new alarm
    chrome.alarms.create('backgroundTask', {
      periodInMinutes: intervalMinutes
    });
    
    console.log('Alarm set to run every', intervalMinutes, 'minutes');
  });
}

// Perform the task that runs when the alarm fires
function performAlarmTask() {
  const now = new Date();
  console.log('Alarm task running at', now.toLocaleString());
  
  // Log the activity
  logActivity('Scheduled task executed.');
  
  // Get settings to check if notifications are enabled
  chrome.storage.sync.get({ enableNotifications: true }, function(items) {
    if (items.enableNotifications) {
      // Show a notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Background Task',
        message: 'A background task was executed at ' + now.toLocaleTimeString(),
        priority: 0
      });
    }
  });
}

// Log activity to storage
function logActivity(message) {
  const entry = {
    timestamp: new Date().getTime(),
    message: message
  };
  
  chrome.storage.local.get({ activityLog: [] }, function(result) {
    // Add new entry
    const updatedLog = [...result.activityLog, entry];
    
    // Keep only the last 100 entries
    const trimmedLog = updatedLog.slice(-100);
    
    // Save back to storage
    chrome.storage.local.set({ activityLog: trimmedLog });
  });
}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    usageCount: 0,
    tags: ['background', 'service worker', 'alarms', 'notifications', 'background tasks']
  },
  
  // Browser Theme Template
  {
    id: 'browser-theme',
    name: 'Browser Theme Extension',
    description: 'Creates a custom theme for Chrome with configurable colors.',
    category: TemplateCategory.Entertainment,
    difficulty: TemplateDifficulty.Beginner,
    manifest: {
      manifest_version: 3,
      name: 'Custom Browser Theme',
      version: '1.0.0',
      description: 'Customizes the appearance of your browser',
      action: {
        default_popup: 'popup.html',
        default_icon: {
          '16': 'icons/icon16.png',
          '48': 'icons/icon48.png',
          '128': 'icons/icon128.png'
        }
      },
      icons: {
        '16': 'icons/icon16.png',
        '48': 'icons/icon48.png',
        '128': 'icons/icon128.png'
      },
      permissions: ['storage', 'theme']
    },
    files: [
      {
        id: crypto.randomUUID(),
        name: 'popup.html',
        path: 'popup.html',
        type: ProjectFileType.HTML,
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Custom Browser Theme</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <h1>Theme Designer</h1>
    
    <div class="section">
      <h2>Color Scheme</h2>
      <div class="form-group">
        <label for="frameColor">Frame Color:</label>
        <input type="color" id="frameColor" value="#4285f4">
      </div>
      <div class="form-group">
        <label for="tabBackgroundColor">Tab Background:</label>
        <input type="color" id="tabBackgroundColor" value="#ffffff">
      </div>
      <div class="form-group">
        <label for="toolbarColor">Toolbar Color:</label>
        <input type="color" id="toolbarColor" value="#f8f9fa">
      </div>
      <div class="form-group">
        <label for="textColor">Text Color:</label>
        <input type="color" id="textColor" value="#000000">
      </div>
    </div>
    
    <div class="preview">
      <h2>Preview</h2>
      <div id="themePreview" class="theme-preview">
        <div id="frame" class="preview-frame">
          <div id="tabs" class="preview-tabs">
            <div class="preview-tab active">Tab 1</div>
            <div class="preview-tab">Tab 2</div>
          </div>
          <div id="toolbar" class="preview-toolbar">
            <div class="preview-toolbar-button"></div>
            <div class="preview-toolbar-button"></div>
            <div class="preview-toolbar-button"></div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="actions">
      <button id="resetTheme">Reset</button>
      <button id="applyTheme">Apply Theme</button>
    </div>
    
    <div id="status"></div>
  </div>
  <script src="popup.js"></script>
</body>
</html>`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'styles.css',
        path: 'styles.css',
        type: ProjectFileType.CSS,
        content: `body {
  font-family: Arial, sans-serif;
  width: 350px;
  padding: 15px;
  margin: 0;
}

#app {
  display: flex;
  flex-direction: column;
}

h1 {
  font-size: 20px;
  margin-bottom: 15px;
}

h2 {
  font-size: 16px;
  margin-bottom: 10px;
}

.section {
  margin-bottom: 20px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.form-group {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

label {
  flex: 1;
  margin-right: 10px;
}

input[type="color"] {
  width: 40px;
  height: 25px;
  border: 1px solid #ddd;
  border-radius: 2px;
}

.preview {
  margin-bottom: 20px;
}

.theme-preview {
  height: 150px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.preview-frame {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #4285f4; /* Default frame color */
}

.preview-tabs {
  display: flex;
  height: 35px;
  padding-top: 5px;
  padding-left: 10px;
}

.preview-tab {
  padding: 8px 15px;
  margin-right: 2px;
  border-radius: 4px 4px 0 0;
  background-color: #e8eaed;
  font-size: 12px;
}

.preview-tab.active {
  background-color: #ffffff; /* Default tab background */
}

.preview-toolbar {
  flex: 1;
  background-color: #f8f9fa; /* Default toolbar color */
  display: flex;
  align-items: center;
  padding: 0 15px;
}

.preview-toolbar-button {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.1);
  margin-right: 10px;
}

.actions {
  display: flex;
  justify-content: space-between;
}

button {
  background-color: #4285f4;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #3367d6;
}

button#resetTheme {
  background-color: #f8f9fa;
  color: #3c4043;
  border: 1px solid #dadce0;
}

button#resetTheme:hover {
  background-color: #f1f3f4;
}

#status {
  margin-top: 10px;
  padding: 8px;
  border-radius: 4px;
  text-align: center;
}

.success {
  background-color: #d4edda;
  color: #155724;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'popup.js',
        path: 'popup.js',
        type: ProjectFileType.JAVASCRIPT,
        content: `// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Default theme colors
  const defaultColors = {
    frameColor: '#4285f4',
    tabBackgroundColor: '#ffffff',
    toolbarColor: '#f8f9fa',
    textColor: '#000000'
  };
  
  // Get references to DOM elements
  const frameColorInput = document.getElementById('frameColor');
  const tabBackgroundColorInput = document.getElementById('tabBackgroundColor');
  const toolbarColorInput = document.getElementById('toolbarColor');
  const textColorInput = document.getElementById('textColor');
  const resetThemeButton = document.getElementById('resetTheme');
  const applyThemeButton = document.getElementById('applyTheme');
  const statusDiv = document.getElementById('status');
  
  // Preview elements
  const frameEl = document.getElementById('frame');
  const tabEl = document.querySelector('.preview-tab.active');
  const toolbarEl = document.getElementById('toolbar');
  
  // Load saved theme
  chrome.storage.sync.get(defaultColors, function(items) {
    // Set input values
    frameColorInput.value = items.frameColor;
    tabBackgroundColorInput.value = items.tabBackgroundColor;
    toolbarColorInput.value = items.toolbarColor;
    textColorInput.value = items.textColor;
    
    // Update preview
    updatePreview(items);
  });
  
  // Update preview when colors change
  frameColorInput.addEventListener('input', updatePreviewFromInputs);
  tabBackgroundColorInput.addEventListener('input', updatePreviewFromInputs);
  toolbarColorInput.addEventListener('input', updatePreviewFromInputs);
  textColorInput.addEventListener('input', updatePreviewFromInputs);
  
  // Reset theme to defaults
  resetThemeButton.addEventListener('click', function() {
    // Reset input values
    frameColorInput.value = defaultColors.frameColor;
    tabBackgroundColorInput.value = defaultColors.tabBackgroundColor;
    toolbarColorInput.value = defaultColors.toolbarColor;
    textColorInput.value = defaultColors.textColor;
    
    // Update preview
    updatePreview(defaultColors);
    
    // Show message
    showStatus('Theme reset to defaults', 'success');
  });
  
  // Apply theme when button is clicked
  applyThemeButton.addEventListener('click', function() {
    const theme = {
      frameColor: frameColorInput.value,
      tabBackgroundColor: tabBackgroundColorInput.value,
      toolbarColor: toolbarColorInput.value,
      textColor: textColorInput.value
    };
    
    // Save theme to storage
    chrome.storage.sync.set(theme, function() {
      // Apply theme to browser
      applyThemeToBrowser(theme);
      
      // Show success message
      showStatus('Theme applied!', 'success');
    });
  });
  
  // Update preview from current input values
  function updatePreviewFromInputs() {
    updatePreview({
      frameColor: frameColorInput.value,
      tabBackgroundColor: tabBackgroundColorInput.value,
      toolbarColor: toolbarColorInput.value,
      textColor: textColorInput.value
    });
  }
  
  // Update theme preview
  function updatePreview(theme) {
    frameEl.style.backgroundColor = theme.frameColor;
    tabEl.style.backgroundColor = theme.tabBackgroundColor;
    tabEl.style.color = theme.textColor;
    toolbarEl.style.backgroundColor = theme.toolbarColor;
  }
  
  // Apply theme to the browser
  function applyThemeToBrowser(theme) {
    chrome.theme.update({
      images: {},
      colors: {
        frame: theme.frameColor,
        toolbar: theme.toolbarColor,
        tab_text: theme.textColor,
        tab_background_text: '#777777',
        bookmark_text: theme.textColor,
        ntp_background: theme.tabBackgroundColor,
        ntp_text: theme.textColor,
        button_background: [255, 255, 255, 1]
      },
      tints: {
        buttons: [0.33, 0.5, 0.47]
      },
      properties: {}
    });
  }
  
  // Show status message
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
    
    // Clear message after 2 seconds
    setTimeout(function() {
      statusDiv.textContent = '';
      statusDiv.className = '';
    }, 2000);
  }
});`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    usageCount: 0,
    tags: ['theme', 'colors', 'customization', 'browser', 'design']
  },
  
  // Website Monitor Template
  {
    id: 'website-monitor',
    name: 'Website Monitor',
    description: 'Monitors websites for changes and sends notifications.',
    category: TemplateCategory.Productivity,
    difficulty: TemplateDifficulty.Intermediate,
    manifest: {
      manifest_version: 3,
      name: 'Website Monitor',
      version: '1.0.0',
      description: 'Monitors websites for changes and sends notifications',
      action: {
        default_popup: 'popup.html',
        default_icon: {
          '16': 'icons/icon16.png',
          '48': 'icons/icon48.png',
          '128': 'icons/icon128.png'
        }
      },
      icons: {
        '16': 'icons/icon16.png',
        '48': 'icons/icon48.png',
        '128': 'icons/icon128.png'
      },
      background: {
        service_worker: 'background.js'
      },
      permissions: ['storage', 'alarms', 'notifications'],
      host_permissions: ['<all_urls>']
    },
    files: [
      {
        id: crypto.randomUUID(),
        name: 'popup.html',
        path: 'popup.html',
        type: ProjectFileType.HTML,
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Website Monitor</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <h1>Website Monitor</h1>
    
    <div class="section">
      <h2>Add Website to Monitor</h2>
      <form id="addWebsiteForm">
        <div class="form-group">
          <label for="websiteUrl">URL:</label>
          <input type="url" id="websiteUrl" placeholder="https://example.com" required>
        </div>
        <div class="form-group">
          <label for="websiteName">Name:</label>
          <input type="text" id="websiteName" placeholder="Example Website" required>
        </div>
        <div class="form-group">
          <label for="checkInterval">Check Every:</label>
          <select id="checkInterval">
            <option value="15">15 minutes</option>
            <option value="30" selected>30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
            <option value="360">6 hours</option>
            <option value="720">12 hours</option>
            <option value="1440">24 hours</option>
          </select>
        </div>
        <div class="form-group">
          <label for="selector">CSS Selector (optional):</label>
          <input type="text" id="selector" placeholder="#content or .article-text">
        </div>
        <button type="submit">Add Website</button>
      </form>
    </div>
    
    <div class="section">
      <h2>Monitored Websites</h2>
      <div id="websiteList" class="website-list">
        <div class="empty-message">No websites being monitored yet.</div>
      </div>
    </div>
    
    <div id="status"></div>
  </div>
  <script src="popup.js"></script>
</body>
</html>`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'styles.css',
        path: 'styles.css',
        type: ProjectFileType.CSS,
        content: `body {
  font-family: Arial, sans-serif;
  width: 380px;
  padding: 15px;
  margin: 0;
}

#app {
  display: flex;
  flex-direction: column;
}

h1 {
  font-size: 20px;
  margin-bottom: 15px;
}

h2 {
  font-size: 16px;
  margin-bottom: 10px;
}

.section {
  margin-bottom: 20px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.form-group {
  margin-bottom: 12px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

input[type="url"],
input[type="text"],
select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

button {
  background-color: #4285f4;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

button:hover {
  background-color: #3367d6;
}

.website-list {
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

.website-item {
  padding: 10px;
  border-bottom: 1px solid #eeeeee;
}

.website-item:last-child {
  border-bottom: none;
}

.website-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.website-name {
  font-weight: bold;
  width: 70%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.website-actions {
  display: flex;
  gap: 5px;
}

.action-button {
  background: none;
  border: none;
  color: #4285f4;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
}

.action-button:hover {
  text-decoration: underline;
}

.delete-button {
  color: #ea4335;
}

.website-url {
  font-size: 12px;
  color: #5f6368;
  margin-bottom: 5px;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.website-details {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #5f6368;
}

.empty-message {
  padding: 15px;
  text-align: center;
  color: #5f6368;
}

#status {
  margin-top: 10px;
  padding: 8px;
  border-radius: 4px;
  text-align: center;
}

.success {
  background-color: #d4edda;
  color: #155724;
}

.error {
  background-color: #f8d7da;
  color: #721c24;
}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'popup.js',
        path: 'popup.js',
        type: ProjectFileType.JAVASCRIPT,
        content: `// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get references to DOM elements
  const addWebsiteForm = document.getElementById('addWebsiteForm');
  const websiteUrlInput = document.getElementById('websiteUrl');
  const websiteNameInput = document.getElementById('websiteName');
  const checkIntervalSelect = document.getElementById('checkInterval');
  const selectorInput = document.getElementById('selector');
  const websiteListDiv = document.getElementById('websiteList');
  const statusDiv = document.getElementById('status');
  
  // Load monitored websites
  loadWebsites();
  
  // Add website form submission
  addWebsiteForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const url = websiteUrlInput.value.trim();
    const name = websiteNameInput.value.trim();
    const interval = parseInt(checkIntervalSelect.value, 10);
    const selector = selectorInput.value.trim();
    
    addWebsite(url, name, interval, selector);
    
    // Reset form
    addWebsiteForm.reset();
  });
  
  // Load websites from storage
  function loadWebsites() {
    chrome.storage.sync.get({ websites: [] }, function(result) {
      const websites = result.websites;
      
      if (websites.length === 0) {
        websiteListDiv.innerHTML = '<div class="empty-message">No websites being monitored yet.</div>';
        return;
      }
      
      // Display websites
      websiteListDiv.innerHTML = websites.map(function(website, index) {
        return \`
          <div class="website-item" data-id="\${index}">
            <div class="website-header">
              <div class="website-name" title="\${website.name}">\${website.name}</div>
              <div class="website-actions">
                <button class="action-button check-button" data-id="\${index}">Check Now</button>
                <button class="action-button delete-button" data-id="\${index}">Delete</button>
              </div>
            </div>
            <div class="website-url" title="\${website.url}">\${website.url}</div>
            <div class="website-details">
              <span>Check every \${formatInterval(website.interval)}</span>
              <span>Last check: \${website.lastCheck ? formatDate(new Date(website.lastCheck)) : 'Never'}</span>
            </div>
          </div>
        \`;
      }).join('');
      
      // Add event listeners to buttons
      document.querySelectorAll('.check-button').forEach(button => {
        button.addEventListener('click', function() {
          const id = parseInt(this.getAttribute('data-id'), 10);
          checkWebsiteNow(id);
        });
      });
      
      document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', function() {
          const id = parseInt(this.getAttribute('data-id'), 10);
          deleteWebsite(id);
        });
      });
    });
  }
  
  // Add a new website to monitoring
  function addWebsite(url, name, interval, selector) {
    chrome.storage.sync.get({ websites: [] }, function(result) {
      const websites = result.websites;
      
      // Validate URL
      try {
        new URL(url);
      } catch (e) {
        showStatus('Invalid URL format', 'error');
        return;
      }
      
      // Check if URL already exists
      if (websites.some(site => site.url === url)) {
        showStatus('This website is already being monitored', 'error');
        return;
      }
      
      // Create new website object
      const newWebsite = {
        url: url,
        name: name,
        interval: interval,
        selector: selector,
        lastCheck: null,
        lastContent: null,
        lastHash: null,
        dateAdded: new Date().getTime()
      };
      
      // Add to list
      websites.push(newWebsite);
      
      // Save to storage
      chrome.storage.sync.set({ websites: websites }, function() {
        // Show success message
        showStatus('Website added to monitoring', 'success');
        
        // Reload website list
        loadWebsites();
        
        // Notify background script to start monitoring
        chrome.runtime.sendMessage({ 
          action: 'startMonitoring', 
          website: newWebsite 
        });
      });
    });
  }
  
  // Delete a website from monitoring
  function deleteWebsite(id) {
    if (confirm('Are you sure you want to stop monitoring this website?')) {
      chrome.storage.sync.get({ websites: [] }, function(result) {
        const websites = result.websites;
        
        if (id >= 0 && id < websites.length) {
          // Remove the website
          const removed = websites.splice(id, 1)[0];
          
          // Save to storage
          chrome.storage.sync.set({ websites: websites }, function() {
            // Show success message
            showStatus('Website removed from monitoring', 'success');
            
            // Reload website list
            loadWebsites();
            
            // Notify background script to stop monitoring
            chrome.runtime.sendMessage({ 
              action: 'stopMonitoring', 
              url: removed.url 
            });
          });
        }
      });
    }
  }
  
  // Check a website immediately
  function checkWebsiteNow(id) {
    chrome.storage.sync.get({ websites: [] }, function(result) {
      const websites = result.websites;
      
      if (id >= 0 && id < websites.length) {
        // Show message
        showStatus('Checking website now...', 'success');
        
        // Send message to background script
        chrome.runtime.sendMessage({ 
          action: 'checkWebsite', 
          id: id,
          url: websites[id].url 
        }, function(response) {
          if (response && response.success) {
            // Reload website list to update last check time
            loadWebsites();
          }
        });
      }
    });
  }
  
  // Format time interval for display
  function formatInterval(minutes) {
    if (minutes < 60) {
      return minutes + ' minutes';
    } else if (minutes === 60) {
      return '1 hour';
    } else if (minutes < 1440) {
      return (minutes / 60) + ' hours';
    } else {
      return (minutes / 1440) + ' days';
    }
  }
  
  // Format date for display
  function formatDate(date) {
    if (isToday(date)) {
      return 'Today ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
  
  // Check if date is today
  function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
  
  // Show status message
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
    
    // Clear message after 3 seconds
    setTimeout(function() {
      statusDiv.textContent = '';
      statusDiv.className = '';
    }, 3000);
  }
});`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'background.js',
        path: 'background.js',
        type: ProjectFileType.JAVASCRIPT,
        content: `// Initialize when the extension is installed or updated
chrome.runtime.onInstalled.addListener(function() {
  console.log('Website Monitor installed.');
  
  // Set up alarms for existing websites
  chrome.storage.sync.get({ websites: [] }, function(result) {
    const websites = result.websites;
    
    // Set up alarms for each website
    websites.forEach(function(website, index) {
      setupAlarm(website, index);
    });
  });
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('Background received message:', message);
  
  if (message.action === 'startMonitoring') {
    // Setup alarm for the new website
    chrome.storage.sync.get({ websites: [] }, function(result) {
      const index = result.websites.length - 1;
      setupAlarm(message.website, index);
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (message.action === 'stopMonitoring') {
    // Clear alarm for the website
    clearAlarmForUrl(message.url);
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'checkWebsite') {
    // Check the website immediately
    checkWebsite(message.id, message.url);
    sendResponse({ success: true });
    return true;
  }
});

// Handle alarm events
chrome.alarms.onAlarm.addListener(function(alarm) {
  // Check if it's one of our website monitor alarms
  if (alarm.name.startsWith('website-monitor-')) {
    const id = parseInt(alarm.name.split('-')[2], 10);
    
    // Get the website URL from storage
    chrome.storage.sync.get({ websites: [] }, function(result) {
      const websites = result.websites;
      
      if (id >= 0 && id < websites.length) {
        checkWebsite(id, websites[id].url);
      }
    });
  }
});

// Setup alarm for a website
function setupAlarm(website, index) {
  // Create alarm name using index
  const alarmName = \`website-monitor-\${index}\`;
  
  // Clear any existing alarm
  chrome.alarms.clear(alarmName, function() {
    // Create new alarm
    chrome.alarms.create(alarmName, {
      periodInMinutes: website.interval,
      delayInMinutes: 1 // Wait a bit before first check
    });
    
    console.log(\`Alarm set for \${website.name} every \${website.interval} minutes\`);
  });
}

// Clear alarm for a specific URL
function clearAlarmForUrl(url) {
  chrome.storage.sync.get({ websites: [] }, function(result) {
    const websites = result.websites;
    
    // Find the index of the website
    const index = websites.findIndex(site => site.url === url);
    
    if (index !== -1) {
      const alarmName = \`website-monitor-\${index}\`;
      chrome.alarms.clear(alarmName);
      console.log(\`Alarm cleared for \${url}\`);
    }
  });
}

// Check a website for changes
function checkWebsite(id, url) {
  console.log(\`Checking website: \${url}\`);
  
  chrome.storage.sync.get({ websites: [] }, function(result) {
    const websites = result.websites;
    
    if (id >= 0 && id < websites.length) {
      const website = websites[id];
      
      // Fetch the website content
      fetch(website.url)
        .then(response => {
          if (!response.ok) {
            throw new Error(\`HTTP error! Status: \${response.status}\`);
          }
          return response.text();
        })
        .then(html => {
          // Update last check time
          website.lastCheck = new Date().getTime();
          
          // Extract content using selector if provided
          let content = html;
          if (website.selector) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const elements = doc.querySelectorAll(website.selector);
            
            if (elements.length > 0) {
              content = Array.from(elements).map(el => el.outerHTML).join('');
            }
          }
          
          // Calculate hash of content
          const hash = simpleHash(content);
          
          // Check if content has changed
          if (website.lastHash && website.lastHash !== hash) {
            // Content changed - send notification
            sendChangeNotification(website);
          }
          
          // Update website data
          website.lastContent = content.substring(0, 10000); // Limit stored content
          website.lastHash = hash;
          
          // Save updated websites
          websites[id] = website;
          chrome.storage.sync.set({ websites: websites });
          
          console.log(\`Check completed for \${website.url}\`);
        })
        .catch(error => {
          console.error(\`Error checking \${website.url}:\`, error);
          
          // Update last check time anyway
          website.lastCheck = new Date().getTime();
          websites[id] = website;
          chrome.storage.sync.set({ websites: websites });
        });
    }
  });
}

// Send notification about website change
function sendChangeNotification(website) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Website Changed',
    message: \`Changes detected on \${website.name}\`,
    priority: 0,
    buttons: [
      { title: 'View Website' }
    ]
  });
  
  // Handle notification button click
  chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
    if (buttonIndex === 0) {
      // Open the website in a new tab
      chrome.tabs.create({ url: website.url });
    }
  });
}

// Simple hash function for content comparison
function simpleHash(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash.toString();
}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    usageCount: 0,
    tags: ['monitor', 'notifications', 'website', 'changes', 'tracking', 'alerts']
  }
];

// Extension templates data for MCP to store
export const templateContextData = {
  templates: EXTENSION_TEMPLATES,
  categories: Object.values(TemplateCategory),
  difficulties: Object.values(TemplateDifficulty),
  lastUpdated: new Date().toISOString()
};