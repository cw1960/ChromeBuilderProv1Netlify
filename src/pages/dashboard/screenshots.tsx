import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { ScreenshotGenerator } from '../../components/editor';
import Button from '../../components/ui/Button';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

const ScreenshotPage: React.FC = () => {
  const router = useRouter();
  const { projectId } = router.query;
  const [projectData, setProjectData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    // Fetch project data if we have a projectId
    if (projectId) {
      // Simulate fetching project data
      setTimeout(() => {
        setProjectData({
          id: projectId,
          name: 'My Chrome Extension',
          screenshots: []
        });
      }, 500);
    }
  }, [projectId]);
  
  const handleSaveToProject = async (screenshots: string[]) => {
    setIsSaving(true);
    
    // Simulate saving the screenshots to the project
    console.log('Saving screenshots:', screenshots.length);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    alert('Screenshots saved successfully!');
  };
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={projectId ? `/dashboard?projectId=${projectId}` : '/dashboard'}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Screenshot Generator</h1>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="default" 
            onClick={() => router.push(projectId ? `/dashboard/store-listing?projectId=${projectId}` : '/dashboard/store-listing')}
          >
            Store Listing
          </Button>
          <Button 
            variant="default" 
            onClick={() => router.push(projectId ? `/dashboard/icon-generator?projectId=${projectId}` : '/dashboard/icon-generator')}
          >
            Generate Icons
          </Button>
        </div>
      </div>
      
      {projectData ? (
        <ScreenshotGenerator 
          projectData={projectData}
          onSave={handleSaveToProject}
        />
      ) : (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  // You could validate the user's session here
  
  return {
    props: {},
  };
};

export default ScreenshotPage;