import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { X, Plus, Folder } from 'lucide-react';
import { useRouter } from 'next/router';

// Use the same Project type as in the dashboard component
type Project = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

interface ProjectSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  isLoading: boolean;
  onCreateProject: (name: string, description: string) => Promise<void>;
  onProjectCreated?: (projectId: string) => void;
}

export default function ProjectSelectionModal({
  isOpen,
  onClose,
  projects,
  isLoading,
  onCreateProject,
  onProjectCreated,
}: ProjectSelectionModalProps) {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowCreateForm(false);
      setName('');
      setDescription('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectProject = (projectId: string) => {
    router.push(`/dashboard/conversation?projectId=${projectId}`);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onCreateProject(name, description);
      // Navigate to the conversation page with the newly created project
      // The project ID will be handled by the parent component
      router.push('/dashboard/conversation');
    } catch (err) {
      setError('Failed to create project. Please try again.');
      console.error('Error in project creation:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {showCreateForm ? 'Create New Extension' : 'Select a Project'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md">
            {error}
          </div>
        )}
        
        {!showCreateForm ? (
          <>
            <div className="mb-4">
              <Button 
                className="w-full justify-start" 
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Extension
              </Button>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Or select an existing project:
              </h3>
              
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : projects.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No projects found. Create a new one to get started.
                </p>
              ) : (
                <ul className="max-h-60 overflow-y-auto space-y-1">
                  {projects.map((project) => (
                    <li key={project.id}>
                      <button
                        onClick={() => handleSelectProject(project.id)}
                        className="w-full text-left px-3 py-2 rounded-md flex items-center hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Folder className="mr-2 h-4 w-4" />
                        <span className="truncate">{project.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleCreateProject}>
            <div className="mb-4">
              <label htmlFor="project-name" className="block text-sm font-medium mb-1">
                Extension Name
              </label>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Chrome Extension"
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="project-description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does your extension do?"
                rows={3}
                className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create & Start'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 