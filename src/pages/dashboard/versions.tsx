import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { VersionManager } from '@/components/editor';
import { getProject, ProjectContext } from '@/lib/supabase-mcp';

export default function VersionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { projectId } = router.query;
  
  const [project, setProject] = useState<ProjectContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Fetch project data
  useEffect(() => {
    async function fetchProject() {
      if (projectId && typeof projectId === 'string') {
        setIsLoading(true);
        const projectData = await getProject(projectId);
        setProject(projectData);
        setIsLoading(false);
      }
    }
    
    if (session?.user?.id) {
      fetchProject();
    }
  }, [projectId, session]);

  // Handle version creation success
  const handleVersionCreated = (version: string) => {
    // Could trigger a success notification here
    console.log(`Version ${version} created successfully`);
  };

  // Handle version restoration
  const handleVersionRestored = (deploymentId: string) => {
    // Could trigger a success notification here
    console.log(`Version restored from deployment ${deploymentId}`);
  };

  if (status === 'loading' || isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-lg text-muted-foreground">Project not found</p>
        <Link href="/dashboard" className="mt-4 text-primary hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Versions | {project.name} | ChromeBuilder Pro</title>
      </Head>

      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-2xl font-bold">
              ChromeBuilder Pro
            </Link>
            
            <span className="mx-2 text-muted-foreground">/</span>
            <Link 
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Projects
            </Link>
            
            <span className="mx-2 text-muted-foreground">/</span>
            <Link 
              href={`/dashboard/generator?projectId=${projectId}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {project.name}
            </Link>
            
            <span className="mx-2 text-muted-foreground">/</span>
            <span className="text-sm font-medium text-foreground">
              Versions
            </span>
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
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="mt-1 text-muted-foreground">Version {project.version}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/generator?projectId=${projectId}`}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-muted"
            >
              Edit Project
            </Link>
            
            <Link
              href={`/dashboard/package?projectId=${projectId}`}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Package Extension
            </Link>
          </div>
        </div>

        <VersionManager 
          projectId={projectId as string} 
          onVersionCreate={handleVersionCreated}
          onVersionRestore={handleVersionRestored}
        />
      </main>
    </div>
  );
}