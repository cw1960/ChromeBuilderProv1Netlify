import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { StoreListingGenerator } from '../../components/editor';
import Button from '../../components/ui/Button';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

// Mock function to simulate API call to generate listing data with AI
const generateWithAI = async (prompt: string) => {
  console.log('Generating store listing with AI using prompt:', prompt);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock data
  return {
    summary: 'An AI-powered Chrome extension for streamlining your workflow and boosting productivity.',
    description: `# ${prompt.split(' ').slice(0, 3).join(' ')} Chrome Extension\n\n` +
      '## Overview\n\n' +
      'This powerful Chrome extension helps you work smarter by automating repetitive tasks, ' +
      'organizing your browser experience, and providing intelligent suggestions based on your browsing habits.\n\n' +
      '## Key Features\n\n' +
      '- **Smart Organization**: Automatically categorize and organize your tabs and bookmarks\n' +
      '- **Workflow Automation**: Create custom rules to automate repetitive browsing tasks\n' +
      '- **Productivity Analytics**: Get insights into your browsing habits and productivity patterns\n' +
      '- **Cross-device Sync**: Seamlessly sync your settings and data across all your devices\n' +
      '- **Privacy-focused**: All your data stays on your device, with optional encrypted cloud backup\n\n' +
      '## How It Works\n\n' +
      'Simply install the extension, customize your preferences, and enjoy a more streamlined ' +
      'browsing experience. The extension learns from your habits to provide increasingly personalized suggestions over time.',
    category: 'Productivity',
    tags: ['productivity', 'automation', 'organization', 'workflow']
  };
};

const StoreListing: React.FC = () => {
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
          summary: '',
          description: ''
        });
      }, 500);
    }
  }, [projectId]);
  
  const handleSaveToProject = async (data: any) => {
    setIsSaving(true);
    
    // Simulate saving the store listing data to the project
    console.log('Saving store listing data:', data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    alert('Store listing saved successfully!');
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
          <h1 className="text-2xl font-bold">Chrome Web Store Listing</h1>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="default" 
            onClick={() => router.push(projectId ? `/dashboard/manifest-editor?projectId=${projectId}` : '/dashboard/manifest-editor')}
          >
            Edit Manifest
          </Button>
          <Button 
            variant="default" 
            onClick={() => router.push(projectId ? `/dashboard/icon-generator?projectId=${projectId}` : '/dashboard/icon-generator')}
          >
            Generate Icons
          </Button>
          <Button 
            variant="default" 
            onClick={() => router.push(projectId ? `/dashboard/screenshots?projectId=${projectId}` : '/dashboard/screenshots')}
          >
            Create Screenshots
          </Button>
        </div>
      </div>
      
      {projectData ? (
        <StoreListingGenerator 
          projectData={projectData}
          onSave={handleSaveToProject}
          onGenerateWithAI={generateWithAI}
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

export default StoreListing;