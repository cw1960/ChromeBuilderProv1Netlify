import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Save, Download } from 'lucide-react';
import ConversationInterface from '@/components/conversation/ConversationInterface';
import { saveConversationAndCode, getProject, createNewProject } from '@/lib/supabase-mcp';

export default function ConversationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { projectId } = router.query;
  
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load project if projectId is provided
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId || typeof projectId !== 'string') {
        setIsLoading(false);
        return;
      }
      
      try {
        const projectData = await getProject(projectId);
        
        if (!projectData) {
          setError('Project not found');
        } else {
          setProject(projectData);
        }
      } catch (err) {
        console.error('Error loading project:', err);
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
      setIsLoading(true);
      
      const newProject = await createNewProject(
        name,
        description
      );
      
      if (newProject) {
        setProject(newProject);
        // Update URL with new project ID without reloading the page
        router.push(`/dashboard/conversation?projectId=${newProject.id}`, undefined, { shallow: true });
      } else {
        setError('Failed to create project');
      }
    } catch (err) {
      console.error('Error creating project:', err);
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
      // If no project exists, create one first
      const projectName = 'Chrome Extension';
      const projectDesc = 'Created from conversation with AI assistant';
      
      try {
        const newProject = await createNewProject(
          projectName,
          projectDesc
        );
        
        if (newProject) {
          setProject(newProject);
          // Update URL with new project ID without reloading the page
          router.push(`/dashboard/conversation?projectId=${newProject.id}`, undefined, { shallow: true });
          
          // Now save the conversation and code to the new project
          return await saveConversationAndCode(newProject.id, messages, files);
        } else {
          return false;
        }
      } catch (err) {
        console.error('Error creating project:', err);
        return false;
      }
    } else {
      // Save to existing project
      return await saveConversationAndCode(project.id, messages, files);
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
        <title>Chrome Extension Builder - Conversation</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mr-4">
                <ArrowLeft className="w-5 h-5 mr-1" />
                Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {project ? project.name : 'New Chrome Extension'}
              </h1>
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
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg h-[calc(100vh-12rem)] overflow-hidden">
              <ConversationInterface 
                projectId={project?.id}
                onCodeGenerated={handleCodeGenerated}
                onSaveConversation={handleSaveConversation}
              />
            </div>
          )}
        </main>
      </div>
    </>
  );
} 