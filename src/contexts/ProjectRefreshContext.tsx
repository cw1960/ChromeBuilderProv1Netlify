import React, { createContext, useContext, useState, useCallback } from 'react';

interface ProjectRefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const ProjectRefreshContext = createContext<ProjectRefreshContextType>({
  refreshTrigger: 0,
  triggerRefresh: () => {},
});

export const useProjectRefresh = () => useContext(ProjectRefreshContext);

export const ProjectRefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const triggerRefresh = useCallback(() => {
    console.log('ProjectRefreshContext: Triggering refresh');
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <ProjectRefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </ProjectRefreshContext.Provider>
  );
};

export default ProjectRefreshProvider; 