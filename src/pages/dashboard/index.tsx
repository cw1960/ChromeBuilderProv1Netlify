import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Plus, Settings, Folder, Code, Package, X, Play, BookOpen, Trash2, Edit, LogOut } from 'lucide-react';
import ProjectCreationModal from '@/components/conversation/ProjectCreationModal';
import ProjectSelectionModal from '@/components/conversation/ProjectSelectionModal';
import ProjectEditModal from '@/components/conversation/ProjectEditModal';
import ChromeApiSimulator from '@/components/chrome/ChromeApiSimulator';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import { Button } from '@/components/ui';
import { createNewProject, getUserProjects, deleteProject, updateProjectDetails, ProjectContext } from '@/lib/supabase-mcp';
import { supabase } from '@/lib/supabase';
import DashboardHeader from '@/components/layout/DashboardHeader';
import ProjectsList from '@/components/dashboard/ProjectsList';
import RecentProjects from '@/components/dashboard/RecentProjects';
import ProjectStats from '@/components/dashboard/ProjectStats';
import { useProjectRefresh } from '@/contexts/ProjectRefreshContext';

// Define Project type for use in this component
type Project = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showProjectSelectionModal, setShowProjectSelectionModal] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [apiKey, setApiKey] = useState('');
  
  // Delete confirmation state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Edit project state
  const [showEditModal, setShowEditModal] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const { refreshTrigger, triggerRefresh } = useProjectRefresh();

  useEffect(() => {
    if (status === 'authenticated') {
      loadProjects();
      
      // Check if API key exists
      const savedApiKey = localStorage.getItem('claude_api_key');
      if (!savedApiKey) {
        setShowApiKeyPrompt(true);
      }
      
      // Check for bypass flag and clear it
      const bypassMiddleware = localStorage.getItem('bypass_middleware');
      if (bypassMiddleware === 'true') {
        console.log('Dashboard - Bypass flag detected, clearing it');
        localStorage.removeItem('bypass_middleware');
        
        // Force a session refresh to update the token with the latest metadata
        const refreshSession = async () => {
          try {
            // Make a direct call to get the latest user data
            const { data } = await supabase.auth.getUser();
            console.log('Dashboard - User metadata:', data?.user?.user_metadata);
          } catch (error) {
            console.error('Error refreshing session:', error);
          }
        };
        
        refreshSession();
      }
    }
  }, [status, router.asPath]);

  // Add an effect to reload projects when the window regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (status === 'authenticated') {
        console.log('Dashboard: Window focused, reloading projects');
        loadProjects();
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [status]);

  useEffect(() => {
    console.log('showProjectModal state changed:', showProjectModal);
  }, [showProjectModal]);

  // Navigate to conversation page when a project is selected from the New Extension flow
  useEffect(() => {
    if (selectedProject && !showProjectModal && !showProjectSelectionModal) {
      console.log('Project selected, navigating to conversation page:', selectedProject);
      router.push(`/dashboard/conversation?projectId=${selectedProject}`);
    }
  }, [selectedProject, showProjectModal, showProjectSelectionModal, router]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      console.log('Dashboard: Loading projects');
      // Add a timestamp to avoid caching issues
      const timestamp = new Date().getTime();
      
      // Get the user ID from the session
      if (!session?.user?.id) {
        console.error('Dashboard: No user ID found in session');
        return;
      }
      
      const userId = session.user.id;
      console.log(`Dashboard: Loading projects for user ${userId}`);
      
      const projectsData = await getUserProjects(timestamp, userId);
      console.log(`Dashboard: Loaded ${projectsData.length} projects`);
      setProjects(projectsData);
    } catch (error) {
      console.error('Dashboard: Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (name: string, description: string): Promise<void> => {
    console.log('Dashboard: handleCreateProject called with:', { name, description });
    try {
      console.log('Dashboard: Creating new project');
      setIsCreatingProject(true);
      
      if (!name.trim()) {
        throw new Error('Project name is required');
      }
      
      const newProject = await createNewProject(
        name,
        description
      );
      
      if (newProject) {
        console.log('Dashboard: Project created successfully:', newProject.id);
        console.log('Dashboard: Closing project modal');
        // Close the project modal
        setShowProjectModal(false);
        
        // Add a longer delay before navigation to ensure database operations complete
        console.log('Dashboard: Adding delay before navigation');
        
        // Reload the projects list to include the new project
        await loadProjects();
        
        // Verify the project exists in the database before navigating
        const verifyProject = async () => {
          try {
            console.log('Dashboard: Verifying project exists in database');
            const response = await fetch(`/api/projects/get-project/?projectId=${newProject.id}`);
            
            if (response.ok) {
              const data = await response.json();
              console.log('Dashboard: Project verified:', data.project.name);
              
              // Navigate to the conversation page with the new project
              console.log('Dashboard: Navigating to conversation page');
              router.push(`/dashboard/conversation?projectId=${newProject.id}`);
            } else {
              console.error('Dashboard: Project verification failed, retrying in 2 seconds');
              // If verification fails, try again after a delay
              setTimeout(verifyProject, 2000);
            }
          } catch (error) {
            console.error('Dashboard: Error verifying project:', error);
            // If verification fails, try again after a delay
            setTimeout(verifyProject, 2000);
          }
        };
        
        // Start verification after a short delay
        setTimeout(verifyProject, 1000);
      } else {
        console.error('Dashboard: createNewProject returned null');
        throw new Error('Failed to create project: The server returned an empty response. Please try again later.');
      }
    } catch (error) {
      console.error('Dashboard: Error creating project:', error);
      
      // Rethrow the error to be handled by the ProjectCreationModal
      throw error;
    } finally {
      setIsCreatingProject(false);
    }
  };

  // Wrapper for ProjectCreationModal that doesn't return the project ID
  const handleCreateProjectVoid = async (name: string, description: string): Promise<void> => {
    console.log('Dashboard: handleCreateProjectVoid called with:', { name, description });
    try {
      console.log('Dashboard: Calling handleCreateProject');
      await handleCreateProject(name, description);
      console.log('Dashboard: Project created successfully');
      
      // After successful project creation, navigate to the conversation page
      if (selectedProject) {
        console.log('Dashboard: Navigating to conversation page with project:', selectedProject);
        router.push(`/dashboard/conversation?projectId=${selectedProject}`);
      }
    } catch (error) {
      console.error('Dashboard: Error in handleCreateProjectVoid:', error);
      // Re-throw the error so the ProjectCreationModal can handle it
      throw error;
    }
  };

  const handleSaveApiKey = () => {
    if (apiKey) {
      localStorage.setItem('claude_api_key', apiKey);
      setShowApiKeyPrompt(false);
    }
  };

  // Toggle Chrome API Simulator visibility
  const toggleSimulator = () => {
    setShowSimulator(!showSimulator);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    setIsDeleting(true);
    try {
      console.log('Dashboard: Deleting project:', projectToDelete);
      const success = await deleteProject(projectToDelete);
      
      if (success) {
        console.log('Dashboard: Project deleted successfully');
        // Remove the project from the state
        setProjects(prev => prev.filter(p => p.id !== projectToDelete));
        
        // If the deleted project was selected, clear the selection
        if (selectedProject === projectToDelete) {
          setSelectedProject(null);
        }
        
        // Trigger refresh for all components
        triggerRefresh();
      } else {
        console.error('Dashboard: Failed to delete project');
        alert('Failed to delete project. Please try again.');
      }
    } catch (error) {
      console.error('Dashboard: Error deleting project:', error);
      alert('An error occurred while deleting the project.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
      setProjectToDelete(null);
    }
  };
  
  const confirmDeleteProject = (projectId: string, event: React.MouseEvent) => {
    // Prevent the click from navigating to the project
    event.preventDefault();
    event.stopPropagation();
    
    setProjectToDelete(projectId);
    setShowDeleteConfirmation(true);
  };

  const handleUpdateProject = async (projectId: string, name: string, description: string): Promise<void> => {
    setIsEditing(true);
    try {
      console.log('Dashboard: Updating project:', projectId);
      const success = await updateProjectDetails(projectId, name, description);
      
      if (success) {
        console.log('Dashboard: Project updated successfully');
        // Update the project in the state
        setProjects(prev => prev.map(p => 
          p.id === projectId 
            ? { ...p, name, description, updated_at: new Date().toISOString() } 
            : p
        ));
      } else {
        console.error('Dashboard: Failed to update project');
        throw new Error('Failed to update project');
      }
    } catch (error) {
      console.error('Dashboard: Error updating project:', error);
      throw error;
    } finally {
      setIsEditing(false);
    }
  };
  
  const openEditModal = (project: Project, event: React.MouseEvent) => {
    // Prevent the click from navigating to the project
    event.preventDefault();
    event.stopPropagation();
    
    setProjectToEdit(project);
    setShowEditModal(true);
  };

  // Debug function to check session and projects
  const debugSession = async () => {
    try {
      console.log('Debug - Session:', session);
      
      // Fetch session data from debug endpoint
      const sessionResponse = await fetch('/api/debug/session');
      const sessionData = await sessionResponse.json();
      console.log('Debug - Session API response:', sessionData);
      
      // Fetch projects directly from Supabase
      if (session?.user?.id) {
        const { data: projects, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', session.user.id);
        
        console.log('Debug - Direct Supabase query for projects:', { projects, error });
      }
      
      // Show alert with basic info
      alert(`Session status: ${status}\nUser ID: ${session?.user?.id || 'Not found'}\nCheck console for details`);
    } catch (error) {
      console.error('Debug error:', error);
      alert('Error during debug. Check console.');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <h1 className="text-xl font-bold">Chrome Builder</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">AI-Powered Extension Builder</p>
        </div>
        
        <div className="p-4">
          <Button 
            className="w-full justify-start mb-2" 
            onClick={() => {
              console.log('New Extension button clicked');
              setShowProjectModal(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Extension
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={() => setShowProjectSelectionModal(true)}
          >
            <Code className="mr-2 h-4 w-4" />
            New Conversation
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Your Projects</h2>
          {/* Project list */}
          <div className="space-y-1 mt-2">
            <ProjectsList 
              onEditProject={openEditModal}
              onDeleteProject={confirmDeleteProject}
            />
          </div>
        </div>
        
        <div className="p-4 border-t dark:border-gray-700">
          <button className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-auto bg-gray-50 dark:bg-gray-900">
        {/* Dashboard Header */}
        <DashboardHeader 
          title="Dashboard" 
          description="Welcome to Chrome Builder. Create and manage your Chrome extensions."
        />
        
        {/* Dashboard Content */}
        <main className="flex-1 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <ProjectStats />
                <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                  <div className="text-sm">
                    <button
                      onClick={() => setShowProjectModal(true)}
                      className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500"
                    >
                      Create new project
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                      <Code className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Recent Activity
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {projects.length > 0 ? 'Active' : 'None'}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                  <div className="text-sm">
                    <button
                      onClick={() => setShowProjectSelectionModal(true)}
                      className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500"
                    >
                      Start new conversation
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          API Status
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {localStorage.getItem('claude_api_key') ? 'Connected' : 'Not Set'}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
                  <div className="text-sm">
                    <button
                      onClick={() => setShowApiKeyPrompt(true)}
                      className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500"
                    >
                      {localStorage.getItem('claude_api_key') ? 'Update API key' : 'Set API key'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Projects */}
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md mb-8">
              <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Recent Projects
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                  Your most recently updated Chrome extensions
                </p>
              </div>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                <RecentProjects 
                  onEditProject={openEditModal}
                  onDeleteProject={confirmDeleteProject}
                />
              </ul>
              {projects.length > 5 && (
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-right sm:px-6">
                  <button
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500"
                    onClick={() => {
                      const sidebar = document.querySelector('.overflow-y-auto');
                      if (sidebar) {
                        sidebar.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    View all projects
                  </button>
                </div>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Quick Actions
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                  Common tasks and resources
                </p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <button
                    onClick={() => setShowProjectModal(true)}
                    className="relative rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="absolute inset-0" aria-hidden="true"></span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Create New Extension
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Start building a new Chrome extension
                      </p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowProjectSelectionModal(true)}
                    className="relative rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Code className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="absolute inset-0" aria-hidden="true"></span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        New Conversation
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Start a new AI conversation for an existing project
                      </p>
                    </div>
                  </button>
                  
                  <a
                    href="https://developer.chrome.com/docs/extensions/mv3/getstarted/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="absolute inset-0" aria-hidden="true"></span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Documentation
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Chrome Extension development resources
                      </p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Chrome API Simulator Modal */}
      {showSimulator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-4/5 h-4/5 flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Chrome API Simulator</h2>
              <Button variant="ghost" size="icon" onClick={toggleSimulator}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChromeApiSimulator 
                projectId={selectedProject || undefined} 
              />
            </div>
          </div>
        </div>
      )}
      
      {/* API Key Modal */}
      {showApiKeyPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Enter Your Claude API Key</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              To use the AI assistant, you need to provide your Claude API key. This will be stored locally on your device.
            </p>
            
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full px-4 py-2 border rounded-md mb-4"
            />
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowApiKeyPrompt(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveApiKey}>
                Save API Key
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Project Creation Modal */}
      {showProjectModal && (
        <ProjectCreationModal
          isOpen={showProjectModal}
          onClose={() => {
            console.log('ProjectCreationModal onClose called');
            setShowProjectModal(false);
          }}
          onCreateProject={handleCreateProjectVoid}
        />
      )}
      
      <ProjectSelectionModal
        isOpen={showProjectSelectionModal}
        onClose={() => setShowProjectSelectionModal(false)}
        projects={projects}
        isLoading={isLoading}
        onCreateProject={handleCreateProject}
      />
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone and all project data, including files, conversations, and settings will be permanently deleted."
        confirmButtonText="Delete Project"
        isDestructive={true}
        isLoading={isDeleting}
      />
      
      {/* Edit Project Modal */}
      {showEditModal && projectToEdit && (
        <ProjectEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setProjectToEdit(null);
          }}
          onUpdateProject={handleUpdateProject}
          projectId={projectToEdit.id}
          initialName={projectToEdit.name}
          initialDescription={projectToEdit.description}
        />
      )}
      
      {/* Debug button - only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button onClick={debugSession} variant="outline" size="sm">
            Debug Session
          </Button>
        </div>
      )}
    </div>
  );
}