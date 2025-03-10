import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ProjectContext, createNewProject } from '@/lib/supabase-mcp';
import { createProjectFromTemplate } from '@/lib/template-manager';
import { TemplateSelector } from '@/components/templates';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectContext[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Fetch user's projects
  useEffect(() => {
    if (session?.user?.id) {
      // This is a placeholder - in a real implementation we would fetch from MCP
      setProjects([]);
      setIsLoading(false);
    }
  }, [session]);

  // Handle selection from template selector
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  // Handle project creation
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProjectName.trim()) return;
    
    let newProject: ProjectContext | null = null;
    
    // Create from template or blank
    if (selectedTemplateId && selectedTemplateId !== 'blank') {
      newProject = createProjectFromTemplate(
        selectedTemplateId,
        newProjectName,
        newProjectDescription || `A Chrome extension for ${newProjectName}`
      );
    } else {
      newProject = createNewProject(
        newProjectName, 
        newProjectDescription || `A Chrome extension for ${newProjectName}`
      );
    }
    
    if (!newProject) {
      console.error('Failed to create project');
      return;
    }
    
    // Add to projects list (in real app would save to MCP)
    setProjects(prev => [...prev, newProject!]);
    
    // Reset form
    setNewProjectName('');
    setNewProjectDescription('');
    setSelectedTemplateId(null);
    setShowNewProjectForm(false);
    setShowTemplateSelector(false);
  };

  if (status === 'loading' || isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Dashboard | ChromeBuilder Pro</title>
      </Head>

      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">ChromeBuilder Pro</h1>
            
            <nav className="ml-8 flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-foreground"
              >
                Projects
              </Link>
              <Link 
                href="/dashboard/search" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Search Resources
              </Link>
              <Link 
                href="/dashboard/generator" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Extension Generator
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session?.user?.email}
            </span>
            <Link 
              href="/api/auth/signout"
              className="text-sm text-primary hover:underline"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold">Your Projects</h2>
          
          <button
            onClick={() => setShowNewProjectForm(true)}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground shadow hover:bg-primary/90"
          >
            New Project
          </button>
        </div>

        {showNewProjectForm && (
          <div className="mb-8 rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-semibold">Create New Project</h3>
            
            {showTemplateSelector ? (
              <div>
                <TemplateSelector onSelectTemplate={handleTemplateSelect} />
                
                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTemplateSelector(false);
                      setSelectedTemplateId(null);
                    }}
                    className="rounded-md border border-input bg-background px-4 py-2 text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTemplateSelector(false)}
                    className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                    disabled={!selectedTemplateId}
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateProject}>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium" htmlFor="project-name">
                    Project Name
                  </label>
                  <input
                    id="project-name"
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="My Awesome Extension"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium" htmlFor="project-description">
                    Description
                  </label>
                  <textarea
                    id="project-description"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="A brief description of your extension"
                    rows={3}
                  />
                </div>
                
                {selectedTemplateId && (
                  <div className="mb-4 p-3 bg-muted rounded-md">
                    <div className="text-sm font-medium">Selected Template: {selectedTemplateId}</div>
                    <button
                      type="button"
                      onClick={() => setShowTemplateSelector(true)}
                      className="text-xs text-primary hover:underline mt-1"
                    >
                      Change Template
                    </button>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <div>
                    {!selectedTemplateId && (
                      <button
                        type="button"
                        onClick={() => setShowTemplateSelector(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        Select a Template
                      </button>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewProjectForm(false);
                        setSelectedTemplateId(null);
                      }}
                      className="rounded-md border border-input bg-background px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                    >
                      Create Project
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="rounded-lg border border-border p-8 text-center">
            <p className="text-lg text-muted-foreground">
              You don't have any projects yet. Create one to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group rounded-lg border border-border bg-card p-6 shadow-sm transition-colors hover:bg-card/80"
              >
                <Link href={`/dashboard/generator?projectId=${project.id}`}>
                  <h3 className="mb-2 text-xl font-semibold group-hover:text-primary">
                    {project.name}
                  </h3>
                </Link>
                <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <span>Version {project.version}</span>
                  <span>
                    {new Date(project.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link 
                    href={`/dashboard/generator?projectId=${project.id}`}
                    className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground"
                  >
                    Edit Project
                  </Link>
                  <Link 
                    href={`/dashboard/manifest-editor?projectId=${project.id}`}
                    className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground"
                  >
                    Manifest Editor
                  </Link>
                  <Link 
                    href={`/dashboard/icon-generator?projectId=${project.id}`}
                    className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground"
                  >
                    Generate Icons
                  </Link>
                  <Link 
                    href={`/dashboard/screenshots?projectId=${project.id}`}
                    className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground"
                  >
                    Screenshots
                  </Link>
                  <Link 
                    href={`/dashboard/store-listing?projectId=${project.id}`}
                    className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground"
                  >
                    Store Listing
                  </Link>
                  <Link 
                    href={`/dashboard/versions?projectId=${project.id}`}
                    className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 text-foreground"
                  >
                    Versions
                  </Link>
                  <Link 
                    href={`/dashboard/package?projectId=${project.id}`}
                    className="text-xs px-2 py-1 rounded bg-primary/15 hover:bg-primary/25 text-primary"
                  >
                    Package & Test
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}