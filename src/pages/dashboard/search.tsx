import { useCallback, useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ArrowLeft, Book, Code, Globe } from 'lucide-react';
import { DocSearch, CodeSearch, SearchBox } from '@/components/search';
import { SearchResult } from '@/lib/search-api';

export default function SearchPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'web' | 'docs' | 'code'>('web');
  const [importedCode, setImportedCode] = useState<{ code: string; source: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && status === 'unauthenticated') {
      window.location.href = '/';
    }
  }, [mounted, status]);
  
  // Show nothing until mounted
  if (!mounted) {
    return null;
  }

  // Check authentication
  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  
  const handleWebResultSelect = (result: SearchResult) => {
    window.open(result.url, '_blank', 'noopener,noreferrer');
  };
  
  const handleCodeImport = useCallback((code: string, source: string) => {
    setImportedCode({ code, source });
  }, []);
  
  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Search Resources | ChromeBuilder Pro</title>
      </Head>
      
      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="mr-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold">Search Resources</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session?.user?.email}
            </span>
            <button
              onClick={() => signOut()}
              className="text-sm text-primary hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex border-b border-border">
          <button
            onClick={() => setSelectedTab('web')}
            className={`flex items-center px-4 py-2 text-sm font-medium ${
              selectedTab === 'web'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe size={16} className="mr-2" />
            Web Search
          </button>
          <button
            onClick={() => setSelectedTab('docs')}
            className={`flex items-center px-4 py-2 text-sm font-medium ${
              selectedTab === 'docs'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Book size={16} className="mr-2" />
            Documentation
          </button>
          <button
            onClick={() => setSelectedTab('code')}
            className={`flex items-center px-4 py-2 text-sm font-medium ${
              selectedTab === 'code'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Code size={16} className="mr-2" />
            Code Examples
          </button>
        </div>
        
        <div className="mt-8">
          {selectedTab === 'web' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Web Search</h2>
                <p className="text-sm text-muted-foreground">
                  Search the web for information about Chrome extension development.
                </p>
              </div>
              
              <SearchBox 
                type="web" 
                placeholder="Search the web..." 
                className="max-w-2xl"
                onResultSelect={handleWebResultSelect}
              />
            </div>
          )}
          
          {selectedTab === 'docs' && (
            <DocSearch />
          )}
          
          {selectedTab === 'code' && (
            <div className="space-y-6">
              <CodeSearch onCodeImport={handleCodeImport} />
              
              {importedCode && (
                <div className="mt-8 space-y-2">
                  <h3 className="text-lg font-medium">Imported Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Source: <a 
                      href={importedCode.source} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {importedCode.source}
                    </a>
                  </p>
                  <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-muted p-4 text-sm">
                    <code>{importedCode.code}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}