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

interface RecentProjectsProps {
  onEditProject: (project: Project, event: React.MouseEvent) => void;
  onDeleteProject: (projectId: string, event: React.MouseEvent) => void;
}

const RecentProjects: React.FC<RecentProjectsProps> = ({ onEditProject, onDeleteProject }) => {
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
      console.log('RecentProjects: Directly fetching projects from API');
      
      // Check if user is authenticated using NextAuth session
      if (status === 'loading') {
        console.log('RecentProjects: Session is loading');
        return; // Wait for session to load
      }
      
      if (status === 'unauthenticated' || !session) {
        console.warn('RecentProjects: No authenticated user found');
        setError('Please sign in to view your projects');
        setIsLoading(false);
        return;
      }
      
      // Get the user ID from the session
      console.log('RecentProjects: Session user:', session.user);
      
      // Try to get the user ID from different possible locations
      let userId = null;
      
      if (session.user?.id) {
        userId = session.user.id;
        console.log('RecentProjects: Using session.user.id:', userId);
      } else if ((session.user as any)?.sub) {
        userId = (session.user as any).sub;
        console.log('RecentProjects: Using session.user.sub:', userId);
      } else if ((session as any).sub) {
        userId = (session as any).sub;
        console.log('RecentProjects: Using session.sub:', userId);
      } else {
        console.error('RecentProjects: Could not find user ID in session:', session);
        setError('Could not determine user ID');
        setIsLoading(false);
        return;
      }
      
      console.log(`RecentProjects: Querying API for user ${userId}`);
      
      // Use the direct-query API endpoint instead of Supabase client
      const response = await fetch(`/api/debug/direct-query?userId=${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('RecentProjects: API error:', errorData);
        setError('Error fetching projects from API');
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log('RecentProjects: API response:', data);
      
      if (!data.projects || data.projects.length === 0) {
        console.log('RecentProjects: No projects found in API response');
        setProjects([]);
        setIsLoading(false);
        return;
      }
      
      // Take only the 5 most recent projects
      const recentProjects = data.projects.slice(0, 5);
      console.log(`RecentProjects: Found ${recentProjects.length} recent projects in API response`);
      setProjects(recentProjects);
    } catch (error) {
      console.error('RecentProjects: Error loading projects:', error);
      setError('Unexpected error loading projects');
    } finally {
      setIsLoading(false);
    }
  };

  // Load projects when the component mounts, session changes, or refresh is triggered
  useEffect(() => {
    if (status !== 'loading') {
      console.log('RecentProjects: Loading projects due to refresh trigger or session change');
      loadProjects();
    }
  }, [status, session, refreshTrigger]);

  // Only reload when the window regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (status === 'authenticated') {
        console.log('RecentProjects: Window focused, reloading projects');
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
      <li className="px-4 py-4 sm:px-6">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </li>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <li className="px-4 py-4 sm:px-6 text-center text-red-500">
        Please sign in to view your projects
      </li>
    );
  }

  if (error) {
    return (
      <li className="px-4 py-4 sm:px-6 text-center text-red-500">
        {error}
        <button 
          onClick={loadProjects}
          className="ml-2 text-blue-500 hover:text-blue-700 underline"
        >
          Retry
        </button>
      </li>
    );
  }

  if (projects.length === 0) {
    return (
      <li className="px-4 py-4 sm:px-6 text-center text-gray-500 dark:text-gray-400">
        No projects yet. Create one to get started!
      </li>
    );
  }

  return (
    <>
      {projects.map((project) => (
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
                onClick={(e) => onEditProject(project, e)}
                variant="outline"
                size="sm"
                className="text-blue-500 hover:text-blue-700 border-blue-200 hover:border-blue-300 dark:text-blue-400 dark:hover:text-blue-300 dark:border-blue-800 dark:hover:border-blue-700"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                onClick={(e) => onDeleteProject(project.id, e)}
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300 dark:border-red-800 dark:hover:border-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </li>
      ))}
    </>
  );
};

export default RecentProjects; 