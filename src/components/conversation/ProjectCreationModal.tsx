import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { X, Check } from 'lucide-react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  console.log('ProjectCreationModal rendered with isOpen:', isOpen);

  useEffect(() => {
    console.log('ProjectCreationModal useEffect triggered with isOpen:', isOpen);
    if (isOpen) {
      console.log('ProjectCreationModal: Resetting form state');
      setName('');
      setDescription('');
      setError(null);
      setSuccess(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    console.log('ProjectCreationModal: Not rendering because isOpen is false');
    return null;
  }

  console.log('ProjectCreationModal: Rendering modal content');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('ProjectCreationModal: handleSubmit called');
    
    if (!name.trim()) {
      console.log('ProjectCreationModal: Project name is empty');
      setError('Project name is required');
      return;
    }
    
    console.log('ProjectCreationModal: Setting isSubmitting to true');
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('ProjectCreationModal: Calling onCreateProject with:', { name, description });
      await onCreateProject(name, description);
      console.log('ProjectCreationModal: Project created successfully');
      setSuccess(true);
      
      // Close the modal after a short delay to show the success message
      console.log('ProjectCreationModal: Setting timeout to close modal');
      setTimeout(() => {
        console.log('ProjectCreationModal: Timeout triggered, closing modal');
        setName('');
        setDescription('');
        onClose();
      }, 1000);
    } catch (err) {
      console.error('ProjectCreationModal: Error in project creation:', err);
      setError('Failed to create project. Please try again.');
      setIsSubmitting(false);
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
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md flex items-center">
            <Check className="h-5 w-5 mr-2" />
            Extension created successfully!
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
              disabled={isSubmitting || success}
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
              disabled={isSubmitting || success}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting || success}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || success}
            >
              {isSubmitting ? 'Creating...' : success ? 'Created!' : 'Create Extension'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 