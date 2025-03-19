import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Send, Loader2, User, Bot } from 'lucide-react';
import { ErrorHandler, ErrorType } from '@/lib/error-handler';
import { ProjectManager, Message } from '@/lib/project-manager';

interface ConversationInterfaceProps {
  projectId: string;
  conversationId?: string;
  onConversationCreated?: (conversationId: string) => void;
}

export default function ConversationInterface({
  projectId,
  conversationId,
  onConversationCreated,
}: ConversationInterfaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize error handler and project manager
  const errorHandler = ErrorHandler.getInstance();
  const projectManager = ProjectManager.getInstance();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load conversation data
  useEffect(() => {
    if (!conversationId) return;
    
    const loadConversationData = async () => {
      setIsLoading(true);
      
      try {
        console.log(`[ConversationInterface] Loading conversation: ${conversationId}`);
        
        // Use ProjectManager to fetch conversation
        const conversation = await projectManager.getConversation(conversationId);
        
        if (conversation) {
          console.log(`[ConversationInterface] Conversation loaded: ${conversation.id}`);
          setMessages(conversation.messages || []);
        } else {
          console.error(`[ConversationInterface] Failed to load conversation: ${conversationId}`);
          
          // Use error handler to handle client error
          errorHandler.handleClientError(
            router,
            'Conversation not found',
            ErrorType.NOT_FOUND,
            404,
            projectId
          );
        }
      } catch (err) {
        console.error(`[ConversationInterface] Error loading conversation:`, err);
        
        // Use error handler to handle client error
        errorHandler.handleClientError(
          router,
          err,
          ErrorType.DATABASE,
          500,
          projectId
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadConversationData();
  }, [conversationId, router, projectId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;
    
    // If no conversation exists, create one
    if (!conversationId) {
      try {
        console.log(`[ConversationInterface] Creating new conversation for project: ${projectId}`);
        setIsSending(true);
        
        // Use ProjectManager to create conversation
        const newConversation = await projectManager.createConversation(projectId);
        
        if (newConversation) {
          console.log(`[ConversationInterface] Conversation created: ${newConversation.id}`);
          
          // Update URL with new conversation ID
          router.push(`/dashboard/conversation?projectId=${projectId}&conversationId=${newConversation.id}`, undefined, { shallow: true });
          
          // Call the onConversationCreated callback if provided
          if (onConversationCreated) {
            onConversationCreated(newConversation.id);
          }
          
          // Add user message to the new conversation
          await addMessageToConversation(newConversation.id, inputValue);
        } else {
          console.error(`[ConversationInterface] Failed to create conversation`);
          
          // Use error handler to handle client error
          errorHandler.handleClientError(
            router,
            'Failed to create conversation',
            ErrorType.DATABASE,
            500,
            projectId
          );
        }
      } catch (err) {
        console.error(`[ConversationInterface] Error creating conversation:`, err);
        
        // Use error handler to handle client error
        errorHandler.handleClientError(
          router,
          err,
          ErrorType.DATABASE,
          500,
          projectId
        );
      } finally {
        setIsSending(false);
      }
    } else {
      // Add message to existing conversation
      await addMessageToConversation(conversationId, inputValue);
    }
  };

  // Add a message to a conversation
  const addMessageToConversation = async (convId: string, content: string) => {
    try {
      console.log(`[ConversationInterface] Adding message to conversation: ${convId}`);
      setIsSending(true);
      
      // Create a temporary message to show immediately
      const tempUserMessage: Message = {
        id: 'temp-' + Date.now(),
        conversation_id: convId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };
      
      // Add to UI immediately
      setMessages(prev => [...prev, tempUserMessage]);
      setInputValue('');
      
      // Use ProjectManager to add message
      const message = await projectManager.addMessageToConversation(convId, content, 'user');
      
      if (message) {
        console.log(`[ConversationInterface] Message added: ${message.id}`);
        
        // Replace temporary message with real one
        setMessages(prev => prev.map(m => m.id === tempUserMessage.id ? message : m));
        
        // Simulate AI response (in a real app, this would be an API call)
        setTimeout(async () => {
          const aiResponse = "I'm an AI assistant. This is a placeholder response. In a real application, this would be generated by an AI model.";
          
          // Add AI response
          const aiMessage = await projectManager.addMessageToConversation(convId, aiResponse, 'assistant');
          
          if (aiMessage) {
            console.log(`[ConversationInterface] AI response added: ${aiMessage.id}`);
            setMessages(prev => [...prev, aiMessage]);
          }
          
          setIsSending(false);
        }, 1000);
      } else {
        console.error(`[ConversationInterface] Failed to add message`);
        
        // Remove temporary message
        setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
        
        // Use error handler to handle client error
        errorHandler.handleClientError(
          router,
          'Failed to send message',
          ErrorType.DATABASE,
          500,
          projectId
        );
        
        setIsSending(false);
      }
    } catch (err) {
      console.error(`[ConversationInterface] Error adding message:`, err);
      
      // Use error handler to handle client error
      errorHandler.handleClientError(
        router,
        err,
        ErrorType.DATABASE,
        500,
        projectId
      );
      
      setIsSending(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  // Handle key press (send on Enter, but allow Shift+Enter for new lines)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format date for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <h3 className="text-lg font-medium mb-2">No messages yet</h3>
              <p>Start a conversation by sending a message below.</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              } mb-4`}
            >
              <div className="flex max-w-[80%]">
                {message.role !== 'user' && (
                  <div className="flex-shrink-0 mr-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                  </div>
                )}
                
                <div>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 px-2">
                    {formatTime(message.created_at)}
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <div className="flex-shrink-0 ml-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 min-h-[80px] max-h-[200px] p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isSending}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 