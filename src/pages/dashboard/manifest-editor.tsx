import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ManifestEditor } from '@/components/editor';
import { getProject, saveProject, ChromeManifest, ProjectContext } from '@/lib/supabase-mcp';
import { AlertTriangle, Save, ArrowLeft, Image } from 'lucide-react';
import DashboardHeader from '@/components/layout/DashboardHeader';

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
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="flex items-center mb-4 text-destructive">
          <AlertTriangle className="h-6 w-6 mr-2" />
          <h2 className="text-xl font-semibold">Error</h2>
        </div>
        <p className="mb-6 text-center">{error}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Manifest Editor">
        <span className="ml-4 text-sm text-muted-foreground">
          {project?.name}
        </span>
      </DashboardHeader>
      
      <div className="container mx-auto p-4">
        <div className="flex justify-end space-x-4 mb-4">
          <button
            onClick={handleBack}
            className="flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
        
        {error && (
          <div className="mb-4 rounded-md bg-destructive/15 p-4 text-destructive">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 rounded-md bg-green-500/15 p-4 text-green-600">
            {success}
          </div>
        )}
        
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-border p-4">
            <h2 className="mb-2 text-lg font-semibold">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Name
                </label>
                <input
                  type="text"
                  value={project?.manifest.name || ''}
                  onChange={(e) => {
                    if (!project) return;
                    handleManifestChange({
                      ...project.manifest,
                      name: e.target.value
                    });
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Version
                </label>
                <input
                  type="text"
                  value={project?.manifest.version || ''}
                  onChange={(e) => {
                    if (!project) return;
                    handleManifestChange({
                      ...project.manifest,
                      version: e.target.value
                    });
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  value={project?.manifest.description || ''}
                  onChange={(e) => {
                    if (!project) return;
                    handleManifestChange({
                      ...project.manifest,
                      description: e.target.value
                    });
                  }}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border border-border p-4">
            <h2 className="mb-2 text-lg font-semibold">Icons</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Default Icons</span>
                <Link
                  href={`/dashboard/icon-generator?projectId=${projectId}`}
                  className="flex items-center text-xs text-primary hover:underline"
                >
                  <Image className="mr-1 h-3 w-3" />
                  Generate Icons
                </Link>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {project?.manifest.icons && Object.entries(project.manifest.icons).map(([size, path]) => (
                  <div key={size} className="flex flex-col items-center">
                    <div className="mb-1 h-12 w-12 rounded-md border border-border flex items-center justify-center">
                      {path ? (
                        <img
                          src={`data:image/png;base64,${path}`}
                          alt={`Icon ${size}px`}
                          className="max-h-10 max-w-10"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">No Icon</span>
                      )}
                    </div>
                    <span className="text-xs">{size}px</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border border-border p-4">
            <h2 className="mb-2 text-lg font-semibold">Permissions</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {project?.manifest.permissions?.map((permission, index) => (
                  <div
                    key={index}
                    className="flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs"
                  >
                    <span>{permission}</span>
                    <button
                      onClick={() => {
                        if (!project) return;
                        const newPermissions = [...project.manifest.permissions!];
                        newPermissions.splice(index, 1);
                        handleManifestChange({
                          ...project.manifest,
                          permissions: newPermissions
                        });
                      }}
                      className="ml-2 text-destructive hover:text-destructive/80"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                
                {(!project?.manifest.permissions || project.manifest.permissions.length === 0) && (
                  <span className="text-xs text-muted-foreground">No permissions added</span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  id="new-permission"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Add permission..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget;
                      const value = input.value.trim();
                      
                      if (value && project) {
                        const permissions = project.manifest.permissions || [];
                        
                        if (!permissions.includes(value)) {
                          handleManifestChange({
                            ...project.manifest,
                            permissions: [...permissions, value]
                          });
                        }
                        
                        input.value = '';
                      }
                    }
                  }}
                />
                
                <button
                  onClick={() => {
                    const input = document.getElementById('new-permission') as HTMLInputElement;
                    const value = input.value.trim();
                    
                    if (value && project) {
                      const permissions = project.manifest.permissions || [];
                      
                      if (!permissions.includes(value)) {
                        handleManifestChange({
                          ...project.manifest,
                          permissions: [...permissions, value]
                        });
                      }
                      
                      input.value = '';
                    }
                  }}
                  className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border border-border p-4">
          <h2 className="mb-4 text-lg font-semibold">Raw Manifest JSON</h2>
          <ManifestEditor
            value={JSON.stringify(project?.manifest || {}, null, 2)}
            onChange={(value) => {
              try {
                const parsed = JSON.parse(value);
                handleManifestChange(parsed);
              } catch (err) {
                // Ignore JSON parse errors while typing
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}