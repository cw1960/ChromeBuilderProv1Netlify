import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Plus, Settings, Folder, Code, Package, X, Play, BookOpen, Trash2, Edit } from 'lucide-react';
import ProjectCreationModal from '@/components/conversation/ProjectCreationModal';
import ProjectSelectionModal from '@/components/conversation/ProjectSelectionModal';
import ProjectEditModal from '@/components/conversation/ProjectEditModal';
import ChromeApiSimulator from '@/components/chrome/ChromeApiSimulator';
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
import { Button } from '@/components/ui';
import { createNewProject, getUserProjects, deleteProject, updateProjectDetails, ProjectContext } from '@/lib/supabase-mcp';
import { supabase } from '@/lib/supabase';

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
  }, [status, router]);

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
      const projectsData = await getUserProjects();
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
      console.log('Dashboard: Calling createNewProject');
      const newProject = await createNewProject(name, description);
      console.log('Dashboard: createNewProject returned:', newProject);
      
      if (newProject) {
        console.log('Dashboard: New project created successfully, loading projects');
        // Load all projects to ensure the list is up to date
        await loadProjects();
        
        console.log('Dashboard: Setting selected project to:', newProject.id);
        // Set the newly created project as the selected project
        setSelectedProject(newProject.id);
        
        console.log('Dashboard: Closing project modal');
        // Close the project modal
        setShowProjectModal(false);
        
        // Navigate to the conversation page with the new project
        console.log('Dashboard: Navigating to conversation page');
        router.push(`/dashboard/conversation?projectId=${newProject.id}`);
      } else {
        console.error('Dashboard: createNewProject returned null');
        throw new Error('Failed to create project: The server returned an empty response. Please try again later.');
      }
    } catch (error) {
      console.error('Dashboard: Error creating project:', error);
      
      // Rethrow the error to be handled by the ProjectCreationModal
      throw error;
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
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : projects.length > 0 ? (
              projects.map((project) => (
                <div key={project.id} className="relative group">
                  <a
                    id={`project-${project.id}`}
                    href={`/dashboard/conversation?projectId=${project.id}`}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                      selectedProject === project.id
                        ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Folder className="mr-2 h-4 w-4" />
                    <span className="truncate">{project.name}</span>
                  </a>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 flex space-x-1">
                    <button
                      onClick={(e) => openEditModal(project, e)}
                      className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
                      title="Edit project"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => confirmDeleteProject(project.id, e)}
                      className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                      title="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                No projects yet
              </div>
            )}
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
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Welcome to Chrome Builder. Create and manage your Chrome extensions.
            </p>
          </div>
        </header>
        
        {/* Dashboard Content */}
        <main className="flex-1 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                      <Folder className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          Total Projects
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {projects.length}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
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
                {isLoading ? (
                  <li className="px-4 py-4 sm:px-6">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  </li>
                ) : projects.length > 0 ? (
                  projects.slice(0, 5).map((project) => (
                    <li key={project.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <Folder className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {project.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">
                              {project.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => router.push(`/dashboard/conversation?projectId=${project.id}`)}
                            variant="outline"
                            size="sm"
                          >
                            Open
                          </Button>
                          <Button
                            onClick={(e) => openEditModal(project, e)}
                            variant="outline"
                            size="sm"
                            className="text-blue-500 hover:text-blue-700 border-blue-200 hover:border-blue-300 dark:text-blue-400 dark:hover:text-blue-300 dark:border-blue-800 dark:hover:border-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={(e) => confirmDeleteProject(project.id, e)}
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300 dark:border-red-800 dark:hover:border-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-4 sm:px-6 text-center text-gray-500 dark:text-gray-400">
                    No projects yet. Create one to get started!
                  </li>
                )}
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
    </div>
  );
}