import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Save, Download, Edit, LogOut } from 'lucide-react';
import ConversationInterface from '@/components/conversation/ConversationInterface';
import ProjectEditModal from '@/components/conversation/ProjectEditModal';
import ConversationSidebar from '@/components/conversation/ConversationSidebar';
import { saveConversationAndCode, getProject, createNewProject, updateProjectDetails } from '@/lib/supabase-mcp';
import { ProjectContext } from '@/types/project';
import DashboardHeader from '@/components/layout/DashboardHeader';
import toast from 'react-hot-toast';
import { Message } from '@/types/message';
import { CodeFile } from '@/types/code';

export default function ConversationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { projectId, conversationId } = router.query;
  
  const [project, setProject] = useState<ProjectContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Load project if projectId is provided
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId || typeof projectId !== 'string') {
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('Conversation: Loading project:', projectId);
        setIsLoading(true);
        
        // Use the direct API endpoint to get the project
        console.log('Conversation: Fetching project from API');
        const response = await fetch(`/api/projects/get-project?projectId=${projectId}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Conversation: Error fetching project from API:', errorText);
          // Only set error if it's not a 404 (project not found)
          if (response.status !== 404) {
            setError('Failed to load project');
          }
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();
        console.log('Conversation: Project loaded successfully from API:', data.project.name);
        setProject(data.project);
        setError(null); // Clear any existing errors
      } catch (err) {
        console.error('Conversation: Error loading project:', err);
        setError('Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProject();
  }, [projectId]);
  
  // Create a new project if none is provided
  const handleCreateProject = async (name: string, description: string) => {
    try {
      console.log('Conversation: Creating new project');
      setIsLoading(true);
      
      const newProject = await createNewProject(
        name,
        description
      );
      
      if (newProject) {
        console.log('Conversation: New project created:', newProject.name);
        setProject(newProject);
        // Update URL with new project ID without reloading the page
        router.push(`/dashboard/conversation?projectId=${newProject.id}`, undefined, { shallow: true });
      } else {
        console.error('Conversation: Failed to create project');
        setError('Failed to create project');
      }
    } catch (err) {
      console.error('Conversation: Error creating project:', err);
      setError('Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle code generation
  const handleCodeGenerated = (code: string, path: string) => {
    console.log(`Generated code for ${path}:`, code);
    // This is handled by the ConversationInterface component now
  };
  
  // Handle creating a new conversation
  const handleNewConversation = async () => {
    if (!project?.id) return;
    
    try {
      console.log('Conversation: Creating new conversation');
      const response = await fetch('/api/conversations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          title: 'New Conversation' // Simple initial title, will be updated later
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }
      
      const conversation = await response.json();
      console.log('Conversation: New conversation created:', conversation.id);
      
      // Navigate to the new conversation
      router.push(`/dashboard/conversation?projectId=${project.id}&conversationId=${conversation.id}`);
    } catch (err) {
      console.error('Conversation: Error creating conversation:', err);
      alert('Failed to create new conversation');
    }
  };
  
  // Handle saving conversation and code
  const handleSaveConversation = async (messages: Message[], files: CodeFile[]) => {
    setIsSaving(true);
    setError(null);
    
    try {
      console.log('Conversation: Saving conversation and code');
      
      // If we don't have a project yet, create one
      if (!project) {
        console.log('Conversation: Creating new project for conversation');
        
        const newProject = await createNewProject(
          'Chrome Extension',
          'Created from conversation with AI assistant',
        );
        
        if (!newProject) {
          throw new Error('Failed to create project');
        }
        
        console.log('Conversation: New project created:', newProject.id);
        
        // If we don't have a conversation ID yet, create one
        let currentConversationId = conversationId as string | undefined;
        
        if (!currentConversationId) {
          try {
            console.log('Conversation: Creating new conversation');
            const response = await fetch('/api/conversations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                projectId: newProject.id,
                title: 'New Conversation',
              }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to create conversation');
            }
            
            const data = await response.json();
            currentConversationId = data.id;
            console.log('Conversation: New conversation created:', currentConversationId);
            
            // Update URL with new project ID and conversation ID without reloading
            const url = new URL(window.location.href);
            url.searchParams.set('projectId', newProject.id);
            url.searchParams.set('conversationId', String(currentConversationId));
            window.history.pushState({}, '', url.toString());
          } catch (err) {
            console.error('Conversation: Error creating conversation:', err);
            // Continue with save even if conversation creation fails
          }
        }
        
        // Save conversation to the new project
        const saveResult = await saveConversationAndCode(
          newProject.id,
          messages,
          files
        );
        
        if (!saveResult) {
          throw new Error('Failed to save conversation to new project');
        }
        
        console.log('Conversation: Saved to new project successfully');
        toast.success('Your conversation has been saved to a new project.');
        
        return true;
      } else {
        // If we don't have a conversation ID yet, create one
        let currentConversationId = conversationId as string | undefined;
        
        if (!currentConversationId) {
          try {
            console.log('Conversation: Creating new conversation for existing project');
            const response = await fetch('/api/conversations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                projectId: project.id,
                title: 'New Conversation',
              }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to create conversation');
            }
            
            const data = await response.json();
            currentConversationId = data.id;
            console.log('Conversation: New conversation created:', currentConversationId);
            
            // Update URL with conversation ID without reloading
            const url = new URL(window.location.href);
            url.searchParams.set('conversationId', String(currentConversationId));
            window.history.pushState({}, '', url.toString());
          } catch (err) {
            console.error('Conversation: Error creating conversation:', err);
            // Continue with save even if conversation creation fails
          }
        }
        
        // Save to existing project
        console.log('Conversation: Saving to existing project:', project.id);
        
        const saveResult = await saveConversationAndCode(
          project.id,
          messages,
          files
        );
        
        if (!saveResult) {
          throw new Error('Failed to save conversation to existing project');
        }
        
        console.log('Conversation: Saved to existing project successfully');
        toast.success('Your conversation and code have been saved.');
        
        return true;
      }
    } catch (err) {
      console.error('Conversation: Error saving conversation:', err);
      setError('Failed to save conversation and code. Please try again.');
      toast.error('There was an error saving your conversation. Your work is still here, but you may want to try again later.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleUpdateProject = async (projectId: string, name: string, description: string): Promise<void> => {
    try {
      console.log('Conversation: Updating project:', projectId);
      const success = await updateProjectDetails(projectId, name, description);
      
      if (success) {
        console.log('Conversation: Project updated successfully');
        // Update the project in the state
        if (project) {
          setProject({
            ...project,
            name,
            description,
            updated_at: new Date().toISOString()
          });
        }
      } else {
        console.error('Conversation: Failed to update project');
        throw new Error('Failed to update project');
      }
    } catch (error) {
      console.error('Conversation: Error updating project:', error);
      throw error;
    }
  };
  
  // Redirect if not authenticated
  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    router.push('/signin');
    return null;
  }
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <DashboardHeader title="Loading Project" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Loading Project</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Please wait while we load your project...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <DashboardHeader title="Error" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
            <div className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">Error Loading Project</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {error}
              </p>
              <Link href="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Chrome Extension Builder - {project ? project.name : 'Conversation'}</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <DashboardHeader title={project ? project.name : 'New Chrome Extension'}>
          <div className="flex items-center ml-4">
            <Link href="/dashboard" className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mr-4">
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back to Dashboard
            </Link>
            {project && (
              <button
                onClick={() => setShowEditModal(true)}
                className="ml-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
                title="Edit project details"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {isSaving && (
              <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                Saving...
              </span>
            )}
          </div>
        </DashboardHeader>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Conversation Sidebar */}
          {project && (
            <ConversationSidebar 
              projectId={project.id}
              currentConversationId={typeof conversationId === 'string' ? conversationId : undefined}
              onNewConversation={handleNewConversation}
            />
          )}
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="max-w-full px-2 py-4">
              <ConversationInterface 
                projectId={project?.id}
                conversationId={typeof conversationId === 'string' ? conversationId : undefined}
                onCodeGenerated={handleCodeGenerated}
                onSaveConversation={handleSaveConversation}
              />
            </div>
          </main>
        </div>
      </div>
      
      {/* Edit Project Modal */}
      {showEditModal && project && (
        <ProjectEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdateProject={handleUpdateProject}
          projectId={project.id}
          initialName={project.name}
          initialDescription={project.description}
        />
      )}
    </>
  );
} 