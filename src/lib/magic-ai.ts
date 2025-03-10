import { magic } from '@smithery/client';
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

  const response = await magic({
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

  const response = await magic({
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

  const response = await magic({
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

  const response = await magic({
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
  
  template.user = `Please create the content script for a Chrome Extension with the following description:
  
${description}

Here is the manifest.json file for reference:
\`\`\`json
${manifest}
\`\`\`

Please provide:
1. A well-structured content script following Chrome Extension best practices
2. Code that safely interacts with web pages
3. Clear comments explaining the code
4. Proper error handling
5. Consideration for performance and page load impact`;

  const response = await magic({
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

// Debug extension code
export async function debugCode(code: string, errors: string): Promise<GeneratedCode> {
  const template = getPromptTemplate(PromptType.DEBUG_CODE);
  
  template.user = `Please help me debug the following Chrome Extension code:
  
\`\`\`
${code}
\`\`\`

I'm encountering the following errors or issues:
${errors}

Please:
1. Identify the problems in the code
2. Provide a fixed version of the code
3. Explain what was causing each issue and how your changes fix it
4. Include any relevant Chrome Extension best practices that would help prevent similar issues`;

  const response = await magic({
    messages: [
      { role: 'system', content: template.system },
      { role: 'user', content: template.user }
    ]
  });

  // Extract the fixed code and explanation from the response
  const content = response.content;
  
  // Find the code block with the fixed code
  const codeMatch = content.match(/```(?:\w+)?\s*([\s\S]*?)\s*```/);
  const fixedCode = codeMatch ? codeMatch[1].trim() : '';
  
  // Get explanation (everything except the code block)
  let explanation = content.replace(/```(?:\w+)?\s*[\s\S]*?\s*```/, '').trim();
  
  // Determine the language based on the original code
  const languageMatch = code.match(/^\/\/ ==UserScript==|^<!-- HTML|^<!DOCTYPE html|^<html|^{[\s\n]*"manifest_version"/);
  let language = 'javascript'; // Default
  
  if (languageMatch) {
    if (languageMatch[0].startsWith('<')) {
      language = 'html';
    } else if (languageMatch[0].startsWith('{')) {
      language = 'json';
    }
  }
  
  return {
    code: fixedCode,
    language,
    explanation
  };
}

// Explain extension code
export async function explainCode(code: string): Promise<string> {
  const template = getPromptTemplate(PromptType.EXPLAIN_CODE);
  
  template.user = `Please explain the following Chrome Extension code:
  
\`\`\`
${code}
\`\`\`

Please provide:
1. A high-level overview of what this code does
2. An explanation of the key components and how they work together
3. Details on any Chrome Extension specific APIs being used
4. Information on the browser features or permissions being utilized
5. Any important security or performance considerations`;

  const response = await magic({
    messages: [
      { role: 'system', content: template.system },
      { role: 'user', content: template.user }
    ]
  });

  return response.content;
}

// Optimize extension code
export async function optimizeCode(code: string, concerns?: string): Promise<GeneratedCode> {
  const template = getPromptTemplate(PromptType.OPTIMIZE_CODE);
  
  template.user = `Please optimize the following Chrome Extension code:
  
\`\`\`
${code}
\`\`\`

${concerns ? `I have the following specific concerns or requirements:\n${concerns}` : ''}

Please provide:
1. An optimized version of the code
2. An explanation of the optimizations made
3. The performance or resource usage benefits of each change
4. Any trade-offs or considerations in your optimization approach`;

  const response = await magic({
    messages: [
      { role: 'system', content: template.system },
      { role: 'user', content: template.user }
    ]
  });

  // Extract the optimized code and explanation from the response
  const content = response.content;
  
  // Find the code block with the optimized code
  const codeMatch = content.match(/```(?:\w+)?\s*([\s\S]*?)\s*```/);
  const optimizedCode = codeMatch ? codeMatch[1].trim() : '';
  
  // Get explanation (everything except the code block)
  let explanation = content.replace(/```(?:\w+)?\s*[\s\S]*?\s*```/, '').trim();
  
  // Determine the language based on the original code
  const languageMatch = code.match(/^\/\/ ==UserScript==|^<!-- HTML|^<!DOCTYPE html|^<html|^{[\s\n]*"manifest_version"/);
  let language = 'javascript'; // Default
  
  if (languageMatch) {
    if (languageMatch[0].startsWith('<')) {
      language = 'html';
    } else if (languageMatch[0].startsWith('{')) {
      language = 'json';
    }
  }
  
  return {
    code: optimizedCode,
    language,
    explanation
  };
}

// Generate guidance for extension icons
export async function generateIconGuidance(extensionName: string, description: string): Promise<string> {
  const template = getPromptTemplate(PromptType.GENERATE_ICONS);
  
  template.user = `Please provide guidance on creating icons for a Chrome Extension with the following details:
  
Name: ${extensionName}
Description: ${description}

Please include:
1. Design suggestions that reflect the extension's purpose and target audience
2. Color scheme recommendations
3. Style and visual elements to consider
4. All required icon sizes for Chrome Extensions
5. Best practices for icon design in browser extensions`;

  const response = await magic({
    messages: [
      { role: 'system', content: template.system },
      { role: 'user', content: template.user }
    ]
  });

  return response.content;
}

// Function to continue a conversation with Magic AI
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
  
  // Get a response from Magic AI
  const response = await magic({
    messages: updatedMessages,
    conversation_id: conversationId
  });
  
  return response.content;
}