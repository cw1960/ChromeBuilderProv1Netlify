// Removing the dependency on @smithery/client
// import { magic } from '@smithery/client';
import { createId } from '@paralleldrive/cuid2';

// Magic AI prompt types
export enum PromptType {
  GENERATE_EXTENSION = 'generate_extension',
  DESIGN_UI = 'design_ui',
  CREATE_MANIFEST = 'create_manifest',
  WRITE_BACKGROUND = 'write_background',
  WRITE_CONTENT_SCRIPT = 'write_content_script',
  DEBUG_CODE = 'debug_code',
  EXPLAIN_CODE = 'explain_code',
  OPTIMIZE_CODE = 'optimize_code',
  GENERATE_ICONS = 'generate_icons'
}

// Interface for the prompt template
interface PromptTemplate {
  system: string;
  user: string;
}

// The extension description type
export interface ExtensionDescription {
  name: string;
  purpose: string;
  features: string[];
  targetAudience?: string;
  permissionsNeeded?: string[];
  additionalNotes?: string;
}

// The result from generating code
export interface GeneratedCode {
  code: string;
  language: string;
  explanation?: string;
}

// The manifest.json generation result
export interface GeneratedManifest {
  manifest: string;
  explanation: string;
}

// Function to create a conversation ID for tracking
export function createConversationId(): string {
  return createId();
}

// Mock implementation of the magic function
async function mockMagic({ messages }: { messages: Array<{ role: string; content: string }> }): Promise<{ content: string }> {
  console.log('Mock AI request:', messages[messages.length - 1].content);
  
  // Return mock responses based on the last message content
  const lastMessage = messages[messages.length - 1].content.toLowerCase();
  
  if (lastMessage.includes('manifest.json')) {
    return {
      content: `Here's a basic manifest.json file for your Chrome extension:

\`\`\`json
{
  "manifest_version": 3,
  "name": "Sample Extension",
  "version": "1.0.0",
  "description": "A sample Chrome extension",
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "permissions": ["storage"],
  "background": {
    "service_worker": "background.js"
  }
}
\`\`\`

This manifest sets up a basic extension with a popup, icons, and storage permission. The background service worker will handle any background tasks.`
    };
  }
  
  if (lastMessage.includes('popup ui') || lastMessage.includes('options page')) {
    return {
      content: `Here's a simple UI for your Chrome extension:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sample Extension</title>
  <style>
    body {
      width: 300px;
      padding: 15px;
      font-family: Arial, sans-serif;
    }
    h1 {
      font-size: 18px;
      color: #4285f4;
    }
    button {
      background-color: #4285f4;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>Sample Extension</h1>
  <p>This is a sample Chrome extension.</p>
  <button id="actionButton">Click Me</button>
  <script src="popup.js"></script>
</body>
</html>
\`\`\`

This UI includes a simple header, description, and button. The styling is clean and follows Material Design principles.`
    };
  }
  
  if (lastMessage.includes('background') || lastMessage.includes('service worker')) {
    return {
      content: `Here's a background service worker for your Chrome extension:

\`\`\`javascript
// Background service worker for Chrome extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  
  // Initialize storage with default values
  chrome.storage.local.set({ enabled: true, count: 0 }, () => {
    console.log('Default settings initialized');
  });
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getData') {
    chrome.storage.local.get(['enabled', 'count'], (result) => {
      sendResponse(result);
    });
    return true; // Required for async response
  }
});
\`\`\`

This background script sets up initial storage values when the extension is installed and handles messages from other parts of the extension.`
    };
  }
  
  if (lastMessage.includes('content script')) {
    return {
      content: `Here's a content script for your Chrome extension:

\`\`\`javascript
// Content script for Chrome extension
console.log('Content script loaded');

// Function to modify the page
function modifyPage() {
  const headings = document.querySelectorAll('h1, h2');
  headings.forEach(heading => {
    heading.style.color = '#4285f4';
  });
  
  // Add a floating button
  const button = document.createElement('button');
  button.textContent = 'Extension Action';
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.zIndex = '9999';
  button.style.padding = '10px';
  button.style.backgroundColor = '#4285f4';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  
  button.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'buttonClicked' });
  });
  
  document.body.appendChild(button);
}

// Run the modification function
modifyPage();
\`\`\`

This content script modifies the page by changing heading colors and adding a floating button that communicates with the background script.`
    };
  }
  
  // Default response for other types of requests
  return {
    content: `Here's a sample response for your request. In a real implementation, this would be generated by an AI model based on your specific prompt.

For Chrome extension development, remember to:
1. Follow Manifest V3 best practices
2. Use the principle of least privilege for permissions
3. Implement proper error handling
4. Test thoroughly across different scenarios
5. Consider both user experience and performance

Let me know if you need more specific guidance!`
  };
}

// System prompts for different tasks
const systemPrompts: Record<PromptType, string> = {
  [PromptType.GENERATE_EXTENSION]: `You are an expert Chrome Extension developer specializing in Manifest V3. 
Your task is to help create a complete Chrome Extension based on the user's description. 
Focus on creating a well-structured, modern extension that follows best practices.
Provide code that is clean, well-commented, and follows modern JavaScript/TypeScript conventions.`,

  [PromptType.DESIGN_UI]: `You are an expert UI designer specializing in Chrome Extension popups and options pages.
Your task is to create beautiful, responsive, and user-friendly interfaces for Chrome Extensions.
Focus on modern design principles, accessibility, and usability while keeping the UI lightweight.
Use modern CSS practices and consider both light and dark themes when applicable.`,

  [PromptType.CREATE_MANIFEST]: `You are an expert in Chrome Extension manifest.json configuration.
Your task is to create a complete and correct manifest.json file based on the extension description.
Focus on using appropriate permissions (with the principle of least privilege), following Manifest V3 requirements,
and setting up the correct extension structure.`,

  [PromptType.WRITE_BACKGROUND]: `You are an expert in Chrome Extension background service workers.
Your task is to create efficient and effective background scripts that follow Manifest V3 best practices.
Focus on using modern JavaScript, proper event listeners, and effective message passing.
Ensure the code is well-commented and follows security best practices.`,

  [PromptType.WRITE_CONTENT_SCRIPT]: `You are an expert in Chrome Extension content scripts.
Your task is to create effective content scripts that can interact with web pages safely and efficiently.
Focus on using modern JavaScript, proper DOM manipulation, and security practices to prevent XSS attacks.
Ensure the code is well-commented and follows Chrome Extension best practices.`,

  [PromptType.DEBUG_CODE]: `You are an expert Chrome Extension debugger.
Your task is to identify and fix issues in Chrome Extension code.
Focus on finding common problems like permission issues, manifest configuration errors,
content script isolation problems, or background worker limitations.
Provide clear explanations of the issues and how your solutions address them.`,

  [PromptType.EXPLAIN_CODE]: `You are an expert Chrome Extension educator.
Your task is to explain Chrome Extension code in a clear, concise, and educational manner.
Focus on helping users understand both what the code does and why certain approaches are used.
Relate explanations to Chrome Extension concepts and browser APIs.`,

  [PromptType.OPTIMIZE_CODE]: `You are an expert Chrome Extension performance optimizer.
Your task is to analyze and optimize Chrome Extension code for better performance and reduced resource usage.
Focus on identifying inefficient patterns, reducing unnecessary operations, and suggesting better approaches.
Consider the unique constraints of extensions such as background worker limits and content script isolation.`,

  [PromptType.GENERATE_ICONS]: `You are an expert in Chrome Extension icon design.
Your task is to provide guidance on creating effective icons for Chrome Extensions.
Focus on describing the design elements, color schemes, and sizes needed for a professional extension.
Provide text-based descriptions that could be used to guide icon creation.`
};

// Function to get a prompt template for a specific task
function getPromptTemplate(type: PromptType): PromptTemplate {
  return {
    system: systemPrompts[type],
    user: '', // To be filled by the specific function
  };
}

// Generate a complete extension based on a description
export async function generateExtension(description: ExtensionDescription): Promise<string> {
  const template = getPromptTemplate(PromptType.GENERATE_EXTENSION);
  
  template.user = `Please help me create a Chrome Extension with the following details:
  
Name: ${description.name}
Purpose: ${description.purpose}
Key Features:
${description.features.map(feature => `- ${feature}`).join('\n')}
${description.targetAudience ? `Target Audience: ${description.targetAudience}` : ''}
${description.permissionsNeeded ? `Permissions Needed: ${description.permissionsNeeded.join(', ')}` : ''}
${description.additionalNotes ? `Additional Notes: ${description.additionalNotes}` : ''}

Please provide:
1. A complete manifest.json file
2. HTML/CSS/JS for the popup UI
3. Any necessary background scripts
4. Any content scripts needed
5. A brief explanation of how the extension works

Please use modern JavaScript and follow Chrome Extension best practices.`;

  const response = await mockMagic({
    messages: [
      { role: 'system', content: template.system },
      { role: 'user', content: template.user }
    ]
  });

  return response.content;
}

// Generate a manifest.json file
export async function generateManifest(description: ExtensionDescription): Promise<GeneratedManifest> {
  const template = getPromptTemplate(PromptType.CREATE_MANIFEST);
  
  template.user = `Please create a complete manifest.json file for a Chrome Extension with the following details:
  
Name: ${description.name}
Purpose: ${description.purpose}
Key Features:
${description.features.map(feature => `- ${feature}`).join('\n')}
${description.permissionsNeeded ? `Permissions Needed: ${description.permissionsNeeded.join(', ')}` : ''}

The manifest should:
1. Follow Manifest V3 requirements
2. Include appropriate permissions (using least privilege principle)
3. Set up the correct extension structure
4. Include appropriate icons placeholders
5. Configure any necessary extension settings

Please provide the complete manifest.json file and a brief explanation of important configuration choices.`;

  const response = await mockMagic({
    messages: [
      { role: 'system', content: template.system },
      { role: 'user', content: template.user }
    ]
  });

  // Extract the manifest JSON and explanation from the response
  const content = response.content;
  
  // Find the JSON code block
  const manifestMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const manifestJson = manifestMatch ? manifestMatch[1].trim() : '';
  
  // Get explanation (everything except the code block)
  let explanation = content.replace(/```(?:json)?\s*[\s\S]*?\s*```/, '').trim();
  
  return {
    manifest: manifestJson,
    explanation
  };
}

// Generate UI code for the popup or options page
export async function generateUI(description: string, type: 'popup' | 'options'): Promise<GeneratedCode> {
  const template = getPromptTemplate(PromptType.DESIGN_UI);
  
  template.user = `Please create the ${type === 'popup' ? 'popup UI' : 'options page'} HTML, CSS, and JavaScript for a Chrome Extension with the following description:
  
${description}

Please provide:
1. Clean, semantic HTML
2. Modern CSS that works well in both light and dark themes
3. JavaScript that handles the UI interactions
4. Follow material design principles or a clean, modern aesthetic
5. Ensure the UI is responsive and accessible

The code should be well-structured and commented.`;

  const response = await mockMagic({
    messages: [
      { role: 'system', content: template.system },
      { role: 'user', content: template.user }
    ]
  });

  // Extract the HTML, CSS, and JS code from the response
  const content = response.content;
  
  // Find all code blocks in the content
  const codeBlocks = content.match(/```(?:\w+)?\s*([\s\S]*?)\s*```/g) || [];
  
  // Combine all code blocks
  const combinedCode = codeBlocks
    .map(block => {
      // Remove the markdown code block delimiters and language specifier
      return block.replace(/```(?:\w+)?\s*([\s\S]*?)\s*```/g, '$1').trim();
    })
    .join('\n\n');
  
  return {
    code: combinedCode,
    language: 'html', // This is a combination of HTML, CSS, and JS
    explanation: content.replace(/```(?:\w+)?\s*[\s\S]*?\s*```/g, '').trim()
  };
}

// Generate background service worker code
export async function generateBackgroundScript(description: string, manifest: string): Promise<GeneratedCode> {
  const template = getPromptTemplate(PromptType.WRITE_BACKGROUND);
  
  template.user = `Please create the background service worker for a Chrome Extension with the following description:
  
${description}

Here is the manifest.json file for reference:
\`\`\`json
${manifest}
\`\`\`

Please provide:
1. A well-structured background service worker script following Manifest V3 best practices
2. Code that handles the necessary background tasks for this extension
3. Clear comments explaining the code
4. Proper error handling
5. Efficient event listeners`;

  const response = await mockMagic({
    messages: [
      { role: 'system', content: template.system },
      { role: 'user', content: template.user }
    ]
  });

  // Extract the code and explanation from the response
  const content = response.content;
  
  // Find the JavaScript code block
  const codeMatch = content.match(/```(?:javascript|js)?\s*([\s\S]*?)\s*```/);
  const code = codeMatch ? codeMatch[1].trim() : '';
  
  // Get explanation (everything except the code block)
  let explanation = content.replace(/```(?:javascript|js)?\s*[\s\S]*?\s*```/, '').trim();
  
  return {
    code,
    language: 'javascript',
    explanation
  };
}

// Generate content script code
export async function generateContentScript(description: string, manifest: string): Promise<GeneratedCode> {
  const template = getPromptTemplate(PromptType.WRITE_CONTENT_SCRIPT);
  
  template.user = `Please create a content script for a Chrome Extension with the following description:
  
${description}

Here is the manifest.json file for reference:
\`\`\`json
${manifest}
\`\`\`

Please provide:
1. A well-structured content script following Chrome Extension best practices
2. Code that interacts with web pages safely and efficiently
3. Clear comments explaining the code
4. Proper error handling
5. Consideration for performance and security`;

  const response = await mockMagic({
    messages: [
      { role: 'system', content: template.system },
      { role: 'user', content: template.user }
    ]
  });

  // Extract the code and explanation from the response
  const content = response.content;
  
  // Find the JavaScript code block
  const codeMatch = content.match(/```(?:javascript|js)?\s*([\s\S]*?)\s*```/);
  const code = codeMatch ? codeMatch[1].trim() : '';
  
  // Get explanation (everything except the code block)
  let explanation = content.replace(/```(?:javascript|js)?\s*[\s\S]*?\s*```/, '').trim();
  
  return {
    code,
    language: 'javascript',
    explanation
  };
}

// Debug code and provide fixes
export async function debugCode(code: string, errors: string): Promise<GeneratedCode> {
  const template = getPromptTemplate(PromptType.DEBUG_CODE);
  
  template.user = `Please help debug the following Chrome Extension code:
  
\`\`\`
${code}
\`\`\`

The errors/issues I'm experiencing are:
${errors}

Please:
1. Identify the issues in the code
2. Provide a fixed version of the code
3. Explain what was causing each issue and how your changes fix it
4. Suggest any best practices or improvements`;

  const response = await mockMagic({
    messages: [
      { role: 'system', content: template.system },
      { role: 'user', content: template.user }
    ]
  });

  // Extract the code and explanation from the response
  const content = response.content;
  
  // Find the code block with the fixed code
  const codeMatch = content.match(/```(?:\w+)?\s*([\s\S]*?)\s*```/);
  const fixedCode = codeMatch ? codeMatch[1].trim() : '';
  
  // Get explanation (everything except the code block)
  let explanation = content.replace(/```(?:\w+)?\s*[\s\S]*?\s*```/, '').trim();
  
  // Determine the language based on the original code
  let language = 'javascript';
  if (code.includes('<!DOCTYPE html') || code.includes('<html')) {
    language = 'html';
  } else if (code.includes('manifest_version')) {
    language = 'json';
  }
  
  return {
    code: fixedCode,
    language,
    explanation
  };
}

// Explain code
export async function explainCode(code: string): Promise<string> {
  const template = getPromptTemplate(PromptType.EXPLAIN_CODE);
  
  template.user = `Please explain the following Chrome Extension code:
  
\`\`\`
${code}
\`\`\`

Please provide:
1. A high-level overview of what this code does
2. An explanation of key functions and their purpose
3. How this code interacts with Chrome Extension APIs
4. Any potential issues or areas for improvement`;

  const response = await mockMagic({
    messages: [
      { role: 'system', content: template.system },
      { role: 'user', content: template.user }
    ]
  });

  return response.content;
}

// Optimize code
export async function optimizeCode(code: string, concerns?: string): Promise<GeneratedCode> {
  const template = getPromptTemplate(PromptType.OPTIMIZE_CODE);
  
  template.user = `Please optimize the following Chrome Extension code:
  
\`\`\`
${code}
\`\`\`

${concerns ? `Specific concerns: ${concerns}` : ''}

Please provide:
1. An optimized version of the code
2. An explanation of the optimizations made
3. How these changes improve performance or resource usage
4. Any trade-offs involved in the optimizations`;

  const response = await mockMagic({
    messages: [
      { role: 'system', content: template.system },
      { role: 'user', content: template.user }
    ]
  });

  // Extract the code and explanation from the response
  const content = response.content;
  
  // Find the code block with the optimized code
  const codeMatch = content.match(/```(?:\w+)?\s*([\s\S]*?)\s*```/);
  const optimizedCode = codeMatch ? codeMatch[1].trim() : '';
  
  // Get explanation (everything except the code block)
  let explanation = content.replace(/```(?:\w+)?\s*[\s\S]*?\s*```/, '').trim();
  
  // Determine the language based on the original code
  let language = 'javascript';
  if (code.includes('<!DOCTYPE html') || code.includes('<html')) {
    language = 'html';
  } else if (code.includes('manifest_version')) {
    language = 'json';
  }
  
  return {
    code: optimizedCode,
    language,
    explanation
  };
}

// Generate icon guidance
export async function generateIconGuidance(extensionName: string, description: string): Promise<string> {
  const template = getPromptTemplate(PromptType.GENERATE_ICONS);
  
  template.user = `Please provide guidance for creating icons for a Chrome Extension with the following details:
  
Name: ${extensionName}
Description: ${description}

Please provide:
1. Design recommendations (colors, style, imagery)
2. Sizes needed for Chrome Extension icons
3. Best practices for icon design
4. How the icon should represent the extension's purpose`;

  const response = await mockMagic({
    messages: [
      { role: 'system', content: template.system },
      { role: 'user', content: template.user }
    ]
  });

  return response.content;
}

// Continue a conversation with the AI
export async function continueConversation(
  conversationId: string,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  newUserMessage: string
): Promise<string> {
  // Add the new user message to the conversation
  const updatedMessages = [
    ...messages,
    { role: 'user', content: newUserMessage }
  ];
  
  // Call the AI with the updated conversation
  const response = await mockMagic({
    messages: updatedMessages
  });
  
  return response.content;
}