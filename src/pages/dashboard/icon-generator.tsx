import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { IconGenerator } from '@/components/editor';
import { ArrowLeft } from 'lucide-react';
import { getProject, saveProject } from '@/lib/supabase-mcp';

export default function IconGeneratorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [generatedIcons, setGeneratedIcons] = useState<{ [size: string]: string }>({});
  
  // Handle icon generation
  const handleIconsGenerated = (icons: { [size: string]: string }) => {
    setGeneratedIcons(icons);
  };
  
  // Handle applying icons to project
  const handleApplyToProject = async () => {
    const { projectId } = router.query;
    
    if (!projectId || Array.isArray(projectId) || !generatedIcons) {
      alert('Please select a project and generate icons first');
      return;
    }
    
    try {
      // Fetch project
      const project = await getProject(projectId);
      
      if (!project) {
        alert('Project not found');
        return;
      }
      
      // Update manifest with icons
      const updatedManifest = {
        ...project.manifest,
        icons: {
          "16": "icons/icon16.png",
          "48": "icons/icon48.png",
          "128": "icons/icon128.png"
        },
        action: {
          ...project.manifest.action,
          default_icon: {
            "16": "icons/icon16.png",
            "48": "icons/icon48.png",
            "128": "icons/icon128.png"
          }
        }
      };
      
      // Update project
      const updatedProject = {
        ...project,
        manifest: updatedManifest,
        updated_at: new Date().toISOString()
      };
      
      // Save project
      const result = await saveProject(updatedProject);
      
      if (result) {
        alert('Icons have been applied to your project manifest. Download the icon files and add them to your project.');
      } else {
        alert('Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('An error occurred while updating the project.');
    }
  };
  
  // Check authentication
  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    router.push('/');
    return null;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back
            </button>
            <h1 className="text-2xl font-bold">Icon Generator</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session?.user?.email}
            </span>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <p className="text-muted-foreground">
            Create beautiful icons for your Chrome extension in all the required sizes.
            You can create icons from text, uploaded images, or use simple shapes.
          </p>
        </div>
        
        <IconGenerator onIconsGenerated={handleIconsGenerated} />
        
        {router.query.projectId && Object.keys(generatedIcons).length > 0 && (
          <div className="mt-6 p-4 border border-border rounded-md">
            <h3 className="text-lg font-medium mb-2">Apply to Current Project</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You can apply these icons to your current project's manifest.json.
              You'll still need to download the icon files and add them to your project.
            </p>
            <button
              onClick={handleApplyToProject}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Apply to Project Manifest
            </button>
          </div>
        )}
      </main>
    </div>
  );
}