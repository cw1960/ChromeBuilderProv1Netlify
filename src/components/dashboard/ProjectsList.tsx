import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Folder, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useProjectRefresh } from '@/contexts/ProjectRefreshContext';

type Project = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

interface ProjectsListProps {
  onEditProject: (project: Project, event: React.MouseEvent) => void;
  onDeleteProject: (projectId: string, event: React.MouseEvent) => void;
}

const ProjectsList: React.FC<ProjectsListProps> = ({ onEditProject, onDeleteProject }) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { refreshTrigger } = useProjectRefresh();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('ProjectsList: Directly fetching projects from API');
      
      // Check if user is authenticated using NextAuth session
      if (status === 'loading') {
        console.log('ProjectsList: Session is loading');
        return; // Wait for session to load
      }
      
      if (status === 'unauthenticated' || !session) {
        console.warn('ProjectsList: No authenticated user found');
        setError('Please sign in to view your projects');
        setIsLoading(false);
        return;
      }
      
      // Get the user ID from the session
      console.log('ProjectsList: Session user:', session.user);
      
      // Try to get the user ID from different possible locations
      let userId = null;
      
      if (session.user?.id) {
        userId = session.user.id;
        console.log('ProjectsList: Using session.user.id:', userId);
      } else if ((session.user as any)?.sub) {
        userId = (session.user as any).sub;
        console.log('ProjectsList: Using session.user.sub:', userId);
      } else if ((session as any).sub) {
        userId = (session as any).sub;
        console.log('ProjectsList: Using session.sub:', userId);
      } else {
        console.error('ProjectsList: Could not find user ID in session:', session);
        setError('Could not determine user ID');
        setIsLoading(false);
        return;
      }
      
      console.log(`ProjectsList: Querying API for user ${userId}`);
      
      // Use the direct-query API endpoint instead of Supabase client
      const response = await fetch(`/api/debug/direct-query?userId=${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('ProjectsList: API error:', errorData);
        setError('Error fetching projects from API');
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log('ProjectsList: API response:', data);
      
      if (!data.projects || data.projects.length === 0) {
        console.log('ProjectsList: No projects found in API response');
        setProjects([]);
        setIsLoading(false);
        return;
      }
      
      console.log(`ProjectsList: Found ${data.projects.length} projects in API response`);
      setProjects(data.projects);
    } catch (error) {
      console.error('ProjectsList: Error loading projects:', error);
      setError('Unexpected error loading projects');
    } finally {
      setIsLoading(false);
    }
  };

  // Load projects when the component mounts, session changes, or refresh is triggered
  useEffect(() => {
    if (status !== 'loading') {
      console.log('ProjectsList: Loading projects due to refresh trigger or session change');
      loadProjects();
    }
  }, [status, session, refreshTrigger]);

  // Only reload when the window regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (status === 'authenticated') {
        console.log('ProjectsList: Window focused, reloading projects');
        loadProjects();
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="text-center py-4 text-sm text-red-500">
        Please sign in to view your projects
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-sm text-red-500">
        {error}
        <button 
          onClick={loadProjects}
          className="ml-2 text-blue-500 hover:text-blue-700 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
        No projects yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {projects.map((project) => (
        <div key={project.id} className="relative group">
          <a
            id={`project-${project.id}`}
            href={`/dashboard/conversation?projectId=${project.id}`}
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Folder className="mr-2 h-4 w-4" />
            <span className="truncate">{project.name}</span>
          </a>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 flex space-x-1">
            <button
              onClick={(e) => onEditProject(project, e)}
              className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
              title="Edit project"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => onDeleteProject(project.id, e)}
              className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
              title="Delete project"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectsList; 