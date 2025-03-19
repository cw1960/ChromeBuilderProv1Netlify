import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PlusCircle, MessageSquare, Loader2 } from 'lucide-react';
import { ErrorHandler, ErrorType } from '@/lib/error-handler';
import { ProjectManager } from '@/lib/project-manager';

interface ConversationSidebarProps {
  projectId: string;
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}

export default function ConversationSidebar({
  projectId,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationSidebarProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize error handler and project manager
  const errorHandler = ErrorHandler.getInstance();
  const projectManager = ProjectManager.getInstance();

  useEffect(() => {
    if (!projectId) return;
    
    const fetchConversations = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`[ConversationSidebar] Fetching conversations for project: ${projectId}`);
        
        // Use ProjectManager to fetch conversations
        const conversationsData = await projectManager.getProjectConversations(projectId);
        
        if (conversationsData && Array.isArray(conversationsData)) {
          console.log(`[ConversationSidebar] Found ${conversationsData.length} conversations`);
          setConversations(conversationsData);
        } else {
          console.error(`[ConversationSidebar] Invalid conversations data:`, conversationsData);
          setError('Failed to load conversations');
        }
      } catch (err) {
        console.error(`[ConversationSidebar] Error fetching conversations:`, err);
        setError('Failed to load conversations');
        
        // Use error handler to handle client error
        errorHandler.handleClientError(
          router,
          err,
          ErrorType.DATABASE,
          500,
          projectId
        );
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [projectId, router]);

  const handleCreateConversation = async () => {
    try {
      console.log(`[ConversationSidebar] Creating new conversation for project: ${projectId}`);
      
      // Use ProjectManager to create conversation
      const newConversation = await projectManager.createConversation(projectId);
      
      if (newConversation) {
        console.log(`[ConversationSidebar] Conversation created: ${newConversation.id}`);
        
        // Add the new conversation to the list
        setConversations(prev => [newConversation, ...prev]);
        
        // Call the onNewConversation callback
        onNewConversation();
        
        // Select the new conversation
        onSelectConversation(newConversation.id);
      } else {
        console.error(`[ConversationSidebar] Failed to create conversation`);
        setError('Failed to create conversation');
      }
    } catch (err) {
      console.error(`[ConversationSidebar] Error creating conversation:`, err);
      setError('Failed to create conversation');
      
      // Use error handler to handle client error
      errorHandler.handleClientError(
        router,
        err,
        ErrorType.DATABASE,
        500,
        projectId
      );
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={handleCreateConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Conversation</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No conversations yet. Create one to get started.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                    currentConversationId === conversation.id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {conversation.title || 'New Conversation'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(conversation.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 