import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription
} from '@radix-ui/react-dialog';
import { 
  Clock, 
  Tag, 
  Plus, 
  Download, 
  GitBranch, 
  Check, 
  X, 
  ChevronRight, 
  DownloadCloud
} from 'lucide-react';
import { ProjectContext, DeploymentRecord, getProject, saveProject } from '@/lib/supabase-mcp';

interface VersionManagerProps {
  projectId: string;
  onVersionCreate?: (version: string) => void;
  onVersionRestore?: (deploymentId: string) => void;
}

export default function VersionManager({
  projectId,
  onVersionCreate,
  onVersionRestore
}: VersionManagerProps) {
  const [project, setProject] = useState<ProjectContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null);
  const [versionNotes, setVersionNotes] = useState('');
  const [newVersionType, setNewVersionType] = useState<'patch' | 'minor' | 'major'>('patch');
  const [nextVersion, setNextVersion] = useState('');

  // Load project data
  useEffect(() => {
    async function fetchProject() {
      setIsLoading(true);
      const projectData = await getProject(projectId);
      setProject(projectData);
      setIsLoading(false);
      
      // Calculate next version based on current version
      if (projectData) {
        calculateNextVersion(projectData.version, 'patch');
      }
    }
    
    fetchProject();
  }, [projectId]);

  // Calculate the next version based on semver rules
  const calculateNextVersion = (currentVersion: string, type: 'patch' | 'minor' | 'major') => {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    let nextVersionString = '';
    
    if (type === 'major') {
      nextVersionString = `${major + 1}.0.0`;
    } else if (type === 'minor') {
      nextVersionString = `${major}.${minor + 1}.0`;
    } else {
      // patch
      nextVersionString = `${major}.${minor}.${patch + 1}`;
    }
    
    setNextVersion(nextVersionString);
    return nextVersionString;
  };

  // Handler for version type change
  const handleVersionTypeChange = (type: 'patch' | 'minor' | 'major') => {
    setNewVersionType(type);
    if (project) {
      calculateNextVersion(project.version, type);
    }
  };

  // Create a new version
  const handleCreateVersion = async () => {
    if (!project) return;
    
    // Create a new deployment record
    const deploymentId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    // Get a list of all file paths
    const filePaths = project.files.map(file => file.path);
    
    const newDeployment: DeploymentRecord = {
      id: deploymentId,
      version: nextVersion,
      timestamp,
      files: filePaths,
      notes: versionNotes,
      status: 'draft'
    };
    
    // Update project with new version and deployment record
    const updatedProject = {
      ...project,
      version: nextVersion,
      updated_at: timestamp,
      deployment_history: [...project.deployment_history, newDeployment]
    };
    
    // Save to database
    const success = await saveProject(updatedProject);
    
    if (success) {
      setProject(updatedProject);
      setShowCreateDialog(false);
      setVersionNotes('');
      
      if (onVersionCreate) {
        onVersionCreate(nextVersion);
      }
    }
  };

  // Restore a previous version
  const handleRestoreVersion = async (deploymentId: string) => {
    if (!project) return;
    
    // Find the deployment record
    const deployment = project.deployment_history.find(d => d.id === deploymentId);
    if (!deployment) return;
    
    // In a real implementation, we would:
    // 1. Create a backup of the current state
    // 2. Fetch archived files from the deployment
    // 3. Replace current files with the archived version
    
    // For this demo, we'll just update the version number
    const updatedProject = {
      ...project,
      version: deployment.version,
      updated_at: new Date().toISOString()
    };
    
    // Save to database
    const success = await saveProject(updatedProject);
    
    if (success) {
      setProject(updatedProject);
      setSelectedDeployment(null);
      
      if (onVersionRestore) {
        onVersionRestore(deploymentId);
      }
    }
  };

  // Format a date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Loading version history...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Version History</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage versions and deployment history
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={16} />
            Create New Version
          </button>
        </div>
      </div>
      
      <div className="bg-card border border-border rounded-md shadow-sm p-4 mb-6">
        <div className="flex items-center">
          <div className="bg-muted p-2 rounded-md">
            <Tag size={20} className="text-primary" />
          </div>
          <div className="ml-4">
            <h3 className="font-medium">Current Version</h3>
            <p className="text-2xl font-bold">{project?.version || '0.1.0'}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-muted-foreground">Last Updated</p>
            <p className="font-medium">
              {project?.updated_at ? formatDate(project.updated_at) : 'Never'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-2">
        <h3 className="text-lg font-semibold">Deployment History</h3>
      </div>
      
      {project?.deployment_history && project.deployment_history.length > 0 ? (
        <div className="space-y-4">
          {project.deployment_history
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map((deployment) => (
              <div 
                key={deployment.id}
                className={`border border-border rounded-md bg-card transition-colors ${
                  selectedDeployment === deployment.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="p-4 flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="p-2 mr-3 bg-muted rounded-md">
                      <GitBranch size={18} className={deployment.status === 'published' ? 'text-green-500' : 'text-primary'} />
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-medium">Version {deployment.version}</h4>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          deployment.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {deployment.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1">
                        Created {formatDate(deployment.timestamp)}
                      </p>
                      
                      {deployment.notes && (
                        <p className="mt-2 text-sm bg-muted p-2 rounded-md">
                          {deployment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedDeployment(selectedDeployment === deployment.id ? null : deployment.id)}
                      className="text-xs border border-input bg-background hover:bg-muted px-2 py-1 rounded-md flex items-center"
                    >
                      {selectedDeployment === deployment.id ? (
                        <>
                          <X size={12} className="mr-1" />
                          Close
                        </>
                      ) : (
                        <>
                          <ChevronRight size={12} className="mr-1" />
                          Details
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleRestoreVersion(deployment.id)}
                      className="text-xs border border-input bg-background hover:bg-muted px-2 py-1 rounded-md flex items-center"
                    >
                      <Clock size={12} className="mr-1" />
                      Restore
                    </button>
                  </div>
                </div>
                
                {selectedDeployment === deployment.id && (
                  <div className="p-4 border-t border-border bg-muted/30">
                    <h5 className="text-sm font-medium mb-2">Files in this version ({deployment.files.length})</h5>
                    
                    <div className="max-h-40 overflow-y-auto">
                      <ul className="text-xs space-y-1">
                        {deployment.files.map((file, i) => (
                          <li key={i} className="py-1 px-2 hover:bg-muted rounded-sm flex items-center justify-between">
                            <span>{file}</span>
                            <button className="text-primary hover:underline">View</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleRestoreVersion(deployment.id)}
                        className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md flex items-center"
                      >
                        <Clock size={12} className="mr-1" />
                        Restore This Version
                      </button>
                      
                      <button
                        className="text-xs border border-input bg-background hover:bg-muted px-3 py-1.5 rounded-md flex items-center"
                      >
                        <Download size={12} className="mr-1" />
                        Download Files
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">
            No version history yet. Create your first version snapshot!
          </p>
        </div>
      )}
      
      {/* Create New Version Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Version</DialogTitle>
            <DialogDescription>
              Create a new version snapshot of your extension.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Version Type</label>
              <div className="flex border border-border rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleVersionTypeChange('patch')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    newVersionType === 'patch' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Patch
                </button>
                <button
                  type="button"
                  onClick={() => handleVersionTypeChange('minor')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    newVersionType === 'minor' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Minor
                </button>
                <button
                  type="button"
                  onClick={() => handleVersionTypeChange('major')}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    newVersionType === 'major' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Major
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {newVersionType === 'patch' ? 'Bug fixes' : 
                   newVersionType === 'minor' ? 'New features' : 'Breaking changes'}
                </span>
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-2">Current: {project?.version}</span>
                  <span className="font-medium">→</span>
                  <span className="font-medium ml-2 text-primary">{nextVersion}</span>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="version-notes">
                Version Notes
              </label>
              <textarea
                id="version-notes"
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="What's new in this version?"
                rows={4}
              />
            </div>
            
            <div className="bg-muted p-3 rounded-md text-sm mb-4">
              <p>This will create a new version with the following changes:</p>
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Version number will be updated to {nextVersion}</li>
                <li>Current files will be saved as a snapshot</li>
                <li>Version history will be updated</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowCreateDialog(false)}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateVersion}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 flex items-center"
            >
              <Tag size={14} className="mr-1" />
              Create Version {nextVersion}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}