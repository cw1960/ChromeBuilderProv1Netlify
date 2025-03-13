import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Save, Download, Edit } from 'lucide-react';
import ConversationInterface from '@/components/conversation/ConversationInterface';
import ProjectEditModal from '@/components/conversation/ProjectEditModal';
import { saveConversationAndCode, getProject, createNewProject, updateProjectDetails, ProjectContext } from '@/lib/supabase-mcp';

export default function ConversationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { projectId } = router.query;
  
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
        const projectData = await getProject(projectId);
        
        if (!projectData) {
          console.error('Conversation: Project not found:', projectId);
          setError('Project not found');
        } else {
          console.log('Conversation: Project loaded successfully:', projectData.name);
          setProject(projectData);
        }
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
  
  // Handle saving conversation and code
  const handleSaveConversation = async (messages: any[], files: any[]) => {
    if (!project) {
      console.log('Conversation: No project exists, creating one');
      // If no project exists, create one first
      const projectName = 'Chrome Extension';
      const projectDesc = 'Created from conversation with AI assistant';
      
      try {
        setIsSaving(true);
        const newProject = await createNewProject(
          projectName,
          projectDesc
        );
        
        if (newProject) {
          console.log('Conversation: New project created for conversation:', newProject.name);
          setProject(newProject);
          // Update URL with new project ID without reloading the page
          router.push(`/dashboard/conversation?projectId=${newProject.id}`, undefined, { shallow: true });
          
          // Now save the conversation and code to the new project
          console.log('Conversation: Saving conversation and code to new project');
          const result = await saveConversationAndCode(newProject.id, messages, files);
          setIsSaving(false);
          return result;
        } else {
          console.error('Conversation: Failed to create project for conversation');
          setIsSaving(false);
          return false;
        }
      } catch (err) {
        console.error('Conversation: Error creating project for conversation:', err);
        setIsSaving(false);
        return false;
      }
    } else {
      // Save to existing project
      console.log('Conversation: Saving conversation and code to existing project:', project.id);
      setIsSaving(true);
      const result = await saveConversationAndCode(project.id, messages, files);
      setIsSaving(false);
      
      // Reload the project to get the latest data
      if (result) {
        try {
          console.log('Conversation: Reloading project after save');
          const updatedProject = await getProject(project.id);
          if (updatedProject) {
            console.log('Conversation: Project reloaded successfully');
            setProject(updatedProject);
          }
        } catch (err) {
          console.error('Conversation: Error reloading project after save:', err);
        }
      }
      
      return result;
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
  
  return (
    <>
      <Head>
        <title>Chrome Extension Builder - {project ? project.name : 'Conversation'}</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mr-4">
                <ArrowLeft className="w-5 h-5 mr-1" />
                Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                {project ? project.name : 'New Chrome Extension'}
                {project && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="ml-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
                    title="Edit project details"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </h1>
              {isSaving && (
                <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                  Saving...
                </span>
              )}
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-700 dark:text-red-400">{error}</p>
              <button 
                onClick={() => router.push('/dashboard')}
                className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <ConversationInterface 
              projectId={project?.id}
              onCodeGenerated={handleCodeGenerated}
              onSaveConversation={handleSaveConversation}
            />
          )}
        </main>
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