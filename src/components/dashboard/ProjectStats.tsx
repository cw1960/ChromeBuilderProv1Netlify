import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Folder } from 'lucide-react';
import { useProjectRefresh } from '@/contexts/ProjectRefreshContext';

const ProjectStats: React.FC = () => {
  const { data: session, status } = useSession();
  const { refreshTrigger } = useProjectRefresh();
  const [projectCount, setProjectCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjectCount = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('ProjectStats: Directly fetching project count from API');
      
      // Check if user is authenticated using NextAuth session
      if (status === 'loading') {
        console.log('ProjectStats: Session is loading');
        return; // Wait for session to load
      }
      
      if (status === 'unauthenticated' || !session) {
        console.warn('ProjectStats: No authenticated user found');
        setError('Please sign in to view stats');
        setIsLoading(false);
        return;
      }
      
      // Get the user ID from the session
      console.log('ProjectStats: Session user:', session.user);
      
      // Try to get the user ID from different possible locations
      let userId = null;
      
      if (session.user?.id) {
        userId = session.user.id;
        console.log('ProjectStats: Using session.user.id:', userId);
      } else if ((session.user as any)?.sub) {
        userId = (session.user as any).sub;
        console.log('ProjectStats: Using session.user.sub:', userId);
      } else if ((session as any).sub) {
        userId = (session as any).sub;
        console.log('ProjectStats: Using session.sub:', userId);
      } else {
        console.error('ProjectStats: Could not find user ID in session:', session);
        setError('Could not determine user ID');
        setIsLoading(false);
        return;
      }
      
      console.log(`ProjectStats: Querying API for user ${userId}`);
      
      // Use the direct-query API endpoint instead of Supabase client
      const response = await fetch(`/api/debug/direct-query?userId=${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('ProjectStats: API error:', errorData);
        setError('Error fetching project count from API');
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log('ProjectStats: API response:', data);
      
      // Set the project count from the API response
      setProjectCount(data.count || 0);
      console.log(`ProjectStats: Project count: ${data.count || 0}`);
    } catch (error) {
      console.error('ProjectStats: Error loading project count:', error);
      setError('Unexpected error loading project count');
    } finally {
      setIsLoading(false);
    }
  };

  // Load project count when the component mounts, session changes, or refresh is triggered
  useEffect(() => {
    if (status !== 'loading') {
      console.log('ProjectStats: Loading project count due to refresh trigger or session change');
      loadProjectCount();
    }
  }, [status, session, refreshTrigger]);

  // Only reload when the window regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (status === 'authenticated') {
        console.log('ProjectStats: Window focused, reloading project count');
        loadProjectCount();
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [status]);

  return (
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
                {status === 'loading' || isLoading ? (
                  <div className="animate-pulse h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ) : status === 'unauthenticated' ? (
                  <span className="text-red-500">Sign in</span>
                ) : error ? (
                  <span className="text-red-500">Error</span>
                ) : (
                  projectCount
                )}
              </div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default ProjectStats; 