import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { X, Check, AlertCircle } from 'lucide-react';

interface ProjectCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, description: string) => Promise<void>;
}

export default function ProjectCreationModal({
  isOpen,
  onClose,
  onCreateProject,
}: ProjectCreationModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError(null);
      setSuccess(false);
      setIsCreating(false);
    }
  }, [isOpen]);

  // Reset error when name or description changes
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [name, description]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    
    setIsCreating(true);
    setError(null);
    
    try {
      await onCreateProject(name, description);
      setSuccess(true);
      
      // Close the modal after a short delay to show the success message
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1000);
    } catch (error) {
      // Provide a more detailed error message based on the error
      let errorMessage = 'Failed to create project. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('authentication') || error.message.includes('auth')) {
          errorMessage = 'Authentication error. Please sign in again.';
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error.message.includes('database') || error.message.includes('supabase')) {
          errorMessage = 'Database error. Please try again later.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create New Extension</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            disabled={isCreating}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Failed to create project</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md flex items-center">
            <Check className="h-5 w-5 mr-2" />
            <div>
              <p className="font-medium">Success!</p>
              <p className="text-sm">Extension created successfully!</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
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
              disabled={isCreating || success}
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
              disabled={isCreating || success}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isCreating || success}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isCreating || !name.trim() || success}
              className={isCreating ? 'opacity-70 cursor-not-allowed' : ''}
            >
              {isCreating ? 'Creating...' : success ? 'Created!' : 'Create Extension'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 