import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { PackageManager } from '@/components/editor';
import { getProject, ProjectContext } from '@/lib/supabase-mcp';
import DashboardHeader from '@/components/layout/DashboardHeader';

export default function PackagePage() {
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
        <title>Package | {project.name} | ChromeBuilder Pro</title>
      </Head>

      <DashboardHeader title="Package">
        <div className="flex items-center ml-4">
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
            Package
          </span>
        </div>
      </DashboardHeader>

      <main className="container mx-auto p-4">
        <div className="mb-4">
          <Link
            href={`/dashboard/versions?projectId=${projectId}`}
            className="text-sm text-primary hover:underline"
          >
            Version History
          </Link>
        </div>
        
        <PackageManager projectId={projectId as string} />
      </main>
    </div>
  );
}