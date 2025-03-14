import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Bot, User, Download, Save, Copy, Code as CodeIcon, Play } from 'lucide-react';
import { Button } from '@/components/ui';
import { useSession } from 'next-auth/react';
import { createId } from '@paralleldrive/cuid2';
import { ProjectFileType, getProject } from '@/lib/supabase-mcp';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
};

type CodeFile = {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  type: ProjectFileType;
  createdAt: Date;
  updatedAt: Date;
};

type ConversationInterfaceProps = {
  projectId?: string;
  conversationId?: string;
  onCodeGenerated?: (code: string, path: string) => void;
  onComponentCreated?: (component: any) => void;
  onManifestUpdated?: (manifest: any) => void;
  onSaveConversation?: (messages: Message[], files: CodeFile[]) => Promise<boolean>;
  onToggleSimulator?: () => void;
};

const ConversationInterface: React.FC<ConversationInterfaceProps> = ({
  projectId,
  conversationId,
  onCodeGenerated,
  onComponentCreated,
  onManifestUpdated,
  onSaveConversation,
  onToggleSimulator,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<CodeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  
  // Load project data when projectId changes
  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId) return;
      
      try {
        console.log('ConversationInterface: Loading project data for:', projectId);
        const project = await getProject(projectId);
        
        if (project) {
          console.log('ConversationInterface: Project loaded successfully');
          
          // Load conversation history if available
          if (project.conversation_history && project.conversation_history.length > 0) {
            console.log('ConversationInterface: Loading conversation history');
            const loadedMessages = project.conversation_history.map(msg => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp)
            }));
            setMessages(loadedMessages);
          }
          
          // Load files if available
          if (project.files && project.files.length > 0) {
            console.log('ConversationInterface: Loading project files');
            const loadedFiles = project.files.map(file => ({
              id: file.id,
              name: file.name,
              path: file.path,
              content: file.content,
              language: file.path.split('.').pop() || 'text',
              type: file.type,
              createdAt: new Date(file.created_at),
              updatedAt: new Date(file.updated_at)
            }));
            setGeneratedFiles(loadedFiles);
            
            // Select the first file by default
            if (loadedFiles.length > 0 && !selectedFile) {
              setSelectedFile(loadedFiles[0]);
            }
          }
        }
      } catch (err) {
        console.error('ConversationInterface: Error loading project data:', err);
        setError('Failed to load project data');
      }
    };
    
    loadProjectData();
  }, [projectId]);

  // Load conversation data when conversationId changes
  useEffect(() => {
    const loadConversationData = async () => {
      if (!conversationId) return;
      
      try {
        console.log('ConversationInterface: Loading conversation data for:', conversationId);
        const response = await fetch(`/api/conversations/${conversationId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load conversation');
        }
        
        const conversation = await response.json();
        console.log('ConversationInterface: Conversation loaded successfully');
        
        // Set messages from conversation
        if (conversation.messages && conversation.messages.length > 0) {
          const loadedMessages = conversation.messages.map((msg: any) => ({
            id: msg.id || crypto.randomUUID(),
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp || Date.now())
          }));
          setMessages(loadedMessages);
        }
      } catch (err) {
        console.error('ConversationInterface: Error loading conversation data:', err);
        setError('Failed to load conversation data');
      }
    };
    
    loadConversationData();
  }, [conversationId]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: projectId 
            ? 'How can I help you with your Chrome extension today?' 
            : 'What Chrome Extension functionality would you like to build today?',
          timestamp: new Date(),
        },
      ]);
    }
  }, [projectId, messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      // Get API key from localStorage
      const apiKey = localStorage.getItem('claude_api_key');
      
      if (!apiKey) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Please add your Claude API key in the settings to continue.',
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }
      
      // Prepare conversation history for Claude
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      
      // Add system message for context
      const systemMessage = {
        role: 'system',
        content: `Chrome Extension Builder AI Assistant Role
You are the Chrome Extension Builder AI Assistant, an expert guide helping non-technical users create and deploy Chrome extensions through friendly conversation. Your purpose is to make Chrome extension development accessible to everyone, regardless of their coding knowledge.

Your Core Responsibilities
Guide users through the entire extension development process from ideation to Chrome Web Store submission
Write all necessary code based on user descriptions and requirements
Ask clarifying questions to understand exactly what the user wants to build
Explain technical concepts in simple, non-technical language
Keep users informed about where they are in the development process
Suggest improvements to enhance extension functionality and user experience
Provide complete step-by-step guidance for Chrome Web Store submission

Your Approach to User Interaction
Be friendly and encouraging - make users feel comfortable with the process
Use simple language - avoid technical jargon when possible, and explain technical terms when necessary
Be patient and thorough - understand that users may need multiple explanations
Ask specific questions - don't assume what users want; get clear requirements
Provide step-by-step guidance - break complex processes into manageable steps
Offer suggestions - proactively recommend features or improvements users might not know to ask for
Confirm understanding - regularly check that you're meeting the user's needs

User Progress Tracking Framework
Track user progress through these formal development milestones and reference them explicitly in your communication:
Milestone 1: Concept Definition (10%)
Milestone 2: Detailed Requirements (25%)
Milestone 3: Design Complete (40%)
Milestone 4: Initial Development (60%)
Milestone 5: Complete Development (75%)
Milestone 6: Testing & Refinement (90%)
Milestone 7: Submission Ready (100%)

${projectId ? 'You are currently helping with an existing project.' : 'You are helping create a new Chrome extension project.'}

When providing code examples, always use markdown code blocks with the appropriate language tag.
For HTML files, use \`\`\`html, for JavaScript files, use \`\`\`javascript, for CSS files, use \`\`\`css, and for JSON files, use \`\`\`json.`,
      };
      
      // Format messages for Claude API
      const formattedMessages = [
        ...conversationHistory,
        {
          role: userMessage.role,
          content: userMessage.content
        }
      ];
      
      console.log('Sending messages to Claude API with system message:', systemMessage.content.slice(0, 100) + '...');
      console.log('Conversation messages:', JSON.stringify(formattedMessages).slice(0, 200) + '...');
      
      // Call Claude API through our proxy
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [systemMessage, ...formattedMessages],
          apiKey,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error from Claude API:', errorData);
        throw new Error(errorData.error || 'Failed to get response from Claude');
      }
      
      const data = await response.json();
      console.log('Received response from Claude API:', data);
      
      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Invalid response format from Claude API');
      }
      
      // Add assistant response
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content[0].text,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Process any code generation or actions from the response
      processAssistantResponse(data.content[0].text);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Sorry, I encountered an error. Please try again. ${error instanceof Error ? `(${error.message})` : ''}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const processAssistantResponse = (response: string) => {
    // Check for code blocks and extract them
    const codeBlockRegex = /```([\w-]+)?\n([\s\S]*?)```/g;
    let match;
    const newFiles: CodeFile[] = [];
    
    while ((match = codeBlockRegex.exec(response)) !== null) {
      const language = match[1] || 'javascript';
      const code = match[2];
      
      // Determine file path based on language and context
      let filePath = '';
      let fileType = ProjectFileType.OTHER;
      
      if (language === 'json' && response.includes('manifest')) {
        filePath = 'manifest.json';
        fileType = ProjectFileType.JSON;
      } else if (language === 'html') {
        filePath = determineFileName(response, 'html', 'popup.html');
        fileType = ProjectFileType.HTML;
      } else if (language === 'javascript' || language === 'js') {
        if (response.includes('background')) {
          filePath = 'background.js';
        } else if (response.includes('content')) {
          filePath = 'content.js';
        } else {
          filePath = determineFileName(response, 'js', 'popup.js');
        }
        fileType = ProjectFileType.JAVASCRIPT;
      } else if (language === 'css') {
        filePath = determineFileName(response, 'css', 'popup.css');
        fileType = ProjectFileType.CSS;
      }
      
      if (filePath) {
        const newFile: CodeFile = {
          id: createId(),
          name: filePath.split('/').pop() || filePath,
          path: filePath,
          content: code,
          language,
          type: fileType,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        newFiles.push(newFile);
        
        // Call the appropriate callback if file path was determined
        if (onCodeGenerated) {
          onCodeGenerated(code, filePath);
        }
      }
    }
    
    if (newFiles.length > 0) {
      setGeneratedFiles(prev => {
        // Replace files with the same path, add new ones
        const updatedFiles = [...prev];
        
        for (const newFile of newFiles) {
          const existingIndex = updatedFiles.findIndex(f => f.path === newFile.path);
          
          if (existingIndex >= 0) {
            updatedFiles[existingIndex] = newFile;
          } else {
            updatedFiles.push(newFile);
          }
        }
        
        // Select the first file if none is selected
        if (!selectedFile && updatedFiles.length > 0) {
          setSelectedFile(updatedFiles[0]);
        }
        
        return updatedFiles;
      });
    }
    
    // Check for manifest updates
    if (response.includes('manifest.json') && onManifestUpdated) {
      try {
        const manifestRegex = /```json\n([\s\S]*?)```/;
        const manifestMatch = response.match(manifestRegex);
        
        if (manifestMatch && manifestMatch[1]) {
          const manifest = JSON.parse(manifestMatch[1]);
          onManifestUpdated(manifest);
        }
      } catch (error) {
        console.error('Error parsing manifest:', error);
      }
    }
    
    // Check for component creation
    if (response.includes('component') && onComponentCreated) {
      // Extract component details and call the callback
      // This would be more complex in a real implementation
    }
  };
  
  const determineFileName = (response: string, extension: string, defaultName: string): string => {
    // Try to extract a filename from the context
    const fileNameRegex = new RegExp(`([\\w-]+)\\.${extension}`, 'i');
    const match = response.match(fileNameRegex);
    
    if (match && match[0]) {
      return match[0];
    }
    
    return defaultName;
  };
  
  const handleSaveConversation = async () => {
    if (!onSaveConversation || messages.length <= 1) return;
    
    setIsSaving(true);
    
    try {
      // If we have a specific conversation ID, update that conversation
      if (conversationId) {
        console.log('ConversationInterface: Updating existing conversation:', conversationId);
        const response = await fetch(`/api/conversations/${conversationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: messages.map(msg => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp.toISOString()
            }))
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update conversation');
        }
        
        console.log('ConversationInterface: Conversation updated successfully');
      }
      
      // Always save to the project as well (for files and other data)
      const success = await onSaveConversation(messages, generatedFiles);
      
      if (success) {
        alert('Conversation and code saved successfully!');
      } else {
        alert('Failed to save conversation and code.');
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
      alert('An error occurred while saving the conversation.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const downloadZip = async () => {
    if (generatedFiles.length === 0) {
      alert('No files to download.');
      return;
    }
    
    try {
      // Use JSZip to create a zip file
      const JSZip = await import('jszip').then(mod => mod.default || mod);
      const zip = new JSZip();
      
      // Add all generated files to the zip
      for (const file of generatedFiles) {
        zip.file(file.path, file.content);
      }
      
      // Generate the zip file
      const content = await zip.generateAsync({ type: 'blob' });
      
      // Create a download link
      const element = document.createElement('a');
      element.href = URL.createObjectURL(content);
      element.download = `chrome-extension-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Error creating zip file:', error);
      alert('Error creating zip file. Please try again.');
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Code copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy code:', err);
        alert('Failed to copy code to clipboard.');
      });
  };

  return (
    <div className="flex h-full border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      {/* Left panel - Conversation */}
      <div className="flex flex-col w-1/2 border-r">
        <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
          <h2 className="text-lg font-medium">Chrome Extension Builder</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Powered by Claude 3.7 Sonnet
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-12rem)] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-3/4 rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                <div className="flex items-center mb-1">
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 mr-2" />
                  ) : (
                    <Bot className="w-4 h-4 mr-2" />
                  )}
                  <span className="text-xs opacity-75">
                    {message.role === 'user' ? 'You' : 'AI Assistant'}
                  </span>
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  {message.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </div>
                <div className="text-xs opacity-50 mt-1 text-right">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Button variant="outline" size="icon">
              <Paperclip className="w-4 h-4" />
            </Button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={handleSendMessage} disabled={isLoading}>
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </div>
      
      {/* Right panel - Code display */}
      <div className="flex flex-col w-1/2">
        <div className="p-4 border-b bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium">Generated Code</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {generatedFiles.length} file{generatedFiles.length !== 1 ? 's' : ''} generated
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSaveConversation}
              disabled={isSaving || messages.length <= 1}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadZip}
              disabled={generatedFiles.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Zip
            </Button>
            {onToggleSimulator && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onToggleSimulator}
                disabled={generatedFiles.length === 0}
              >
                <Play className="w-4 h-4 mr-2" />
                Test in Simulator
              </Button>
            )}
          </div>
        </div>
        
        {generatedFiles.length > 0 ? (
          <div className="flex flex-col h-full">
            <div className="border-b overflow-x-auto">
              <div className="flex">
                {generatedFiles.map(file => (
                  <button
                    key={file.id}
                    className={`px-4 py-2 text-sm font-medium ${
                      selectedFile?.id === file.id
                        ? 'border-b-2 border-blue-500 text-blue-500'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                    onClick={() => setSelectedFile(file)}
                  >
                    {file.name}
                  </button>
                ))}
              </div>
            </div>
            
            {selectedFile && (
              <div className="flex-1 flex flex-col">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 flex justify-between items-center">
                  <span className="text-sm font-mono">{selectedFile.path}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(selectedFile.content)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    <code>{selectedFile.content}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col p-8 text-center">
            <CodeIcon className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Code Generated Yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
              Ask the AI assistant to help you build a Chrome extension. The generated code will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationInterface; 