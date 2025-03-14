import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MessageSquarePlus, MessageSquare, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
}

interface ConversationSidebarProps {
  projectId: string;
  currentConversationId?: string;
  onNewConversation: () => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  projectId,
  currentConversationId,
  onNewConversation
}) => {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConversations = async () => {
      if (!projectId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/conversations?projectId=${projectId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load conversations');
        }
        
        const data = await response.json();
        setConversations(data);
      } catch (err) {
        console.error('Error loading conversations:', err);
        setError('Failed to load conversations');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadConversations();
  }, [projectId]);

  const handleSelectConversation = (conversationId: string) => {
    router.push(`/dashboard/conversation?projectId=${projectId}&conversationId=${conversationId}`);
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }
      
      // Remove from list
      setConversations(conversations.filter(c => c.id !== conversationId));
      
      // If this was the current conversation, redirect to project page
      if (conversationId === currentConversationId) {
        router.push(`/dashboard/conversation?projectId=${projectId}`);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      alert('Failed to delete conversation');
    }
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b dark:border-gray-700">
        <Button 
          className="w-full justify-start" 
          onClick={onNewConversation}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Conversation
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-2 mb-2">
          Conversations
        </h3>
        
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm p-2">{error}</div>
        ) : conversations.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-sm p-2">
            No conversations yet. Start a new one!
          </div>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  onClick={() => handleSelectConversation(conversation.id)}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between group hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    currentConversationId === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-center truncate">
                    <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{conversation.title || 'Untitled'}</span>
                  </div>
                  
                  <button
                    onClick={(e) => handleDeleteConversation(conversation.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                    title="Delete conversation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ConversationSidebar; 