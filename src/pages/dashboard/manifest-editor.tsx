import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ManifestEditor } from '@/components/editor';
import { getProject, saveProject, ChromeManifest, ProjectContext } from '@/lib/supabase-mcp';
import { AlertTriangle, Save, ArrowLeft, Image } from 'lucide-react';

export default function ManifestEditorPage() {
  const router = useRouter();
  const { projectId } = router.query;
  
  const [project, setProject] = useState<ProjectContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Load project data
  useEffect(() => {
    async function loadProjectData() {
      if (!projectId || Array.isArray(projectId)) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const projectData = await getProject(projectId);
        
        if (!projectData) {
          setError('Project not found');
          return;
        }
        
        setProject(projectData);
      } catch (err) {
        console.error('Error loading project:', err);
        setError('Failed to load project data');
      } finally {
        setLoading(false);
      }
    }
    
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);
  
  // Handle manifest changes
  const handleManifestChange = (manifest: ChromeManifest) => {
    if (!project) return;
    
    setProject({
      ...project,
      manifest
    });
  };
  
  // Save changes
  const handleSave = async () => {
    if (!project) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const updated = {
        ...project,
        updated_at: new Date().toISOString()
      };
      
      const result = await saveProject(updated);
      
      if (result) {
        setSuccess('Manifest saved successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError('Failed to save changes');
      }
    } catch (err) {
      console.error('Error saving project:', err);
      setError('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  // Go back to the project dashboard
  const handleBack = () => {
    router.push(`/dashboard/generator?projectId=${projectId}`);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error && !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-md max-w-md flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p>{error}</p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={handleBack}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Project
          </button>
          <h1 className="text-2xl font-bold">{project?.name} - Manifest Editor</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/icon-generator?projectId=${projectId}`}
            className="flex items-center px-4 py-2 border border-input bg-background rounded-md hover:bg-muted/50 text-sm"
          >
            <Image size={16} className="mr-2" /> Generate Icons
          </Link>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" /> Save Manifest
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Status messages */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center">
          <AlertTriangle size={16} className="mr-2 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
        </div>
      )}
      
      {/* Description */}
      <div className="mb-6 p-4 bg-muted/50 rounded-md">
        <h2 className="text-lg font-semibold mb-2">About the Manifest</h2>
        <p className="text-muted-foreground">
          The manifest.json file is the configuration file for your Chrome extension. It tells Chrome 
          what permissions your extension needs, what resources it can access, and how it integrates 
          with the browser. Use this editor to configure all aspects of your extension.
        </p>
      </div>
      
      {/* Manifest Editor Component */}
      {project && (
        <ManifestEditor 
          manifest={project.manifest} 
          onChange={handleManifestChange}
          onSave={handleSave}
        />
      )}
    </div>
  );
}