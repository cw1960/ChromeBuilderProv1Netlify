import { useState, useEffect } from 'react';
import { ExternalLink, Code, Copy } from 'lucide-react';
import SearchBox from './SearchBox';
import { SearchResult } from '@/lib/search-api';

interface CodeSearchProps {
  className?: string;
  onCodeImport?: (code: string, source: string) => void;
}

export default function CodeSearch({ className = '', onCodeImport }: CodeSearchProps) {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleResultSelect = (result: SearchResult) => {
    setSelectedResult(result);
  };
  
  const handleCopyUrl = () => {
    if (selectedResult && mounted) {
      navigator.clipboard.writeText(selectedResult.url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };
  
  const handleImportCode = () => {
    if (selectedResult && onCodeImport) {
      // In a real implementation, we would fetch and parse the actual code
      // from the repository. For now, we'll just use the description
      onCodeImport(
        `// Code imported from: ${selectedResult.url}\n// ${selectedResult.title}\n\n// Sample code - in a real app, this would be actual code from the source\n// ${selectedResult.description}`,
        selectedResult.url
      );
    }
  };

  if (!mounted) {
    return null;
  }
  
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Find Extension Code Examples</h3>
        <p className="text-sm text-muted-foreground">
          Search for Chrome extension code examples, snippets, and sample projects.
        </p>
      </div>
      
      <SearchBox 
        type="code" 
        placeholder="Search for code examples..." 
        onResultSelect={handleResultSelect}
      />
      
      {selectedResult && (
        <div className="mt-4 rounded-md border border-border p-4">
          <div className="flex items-start justify-between">
            <h3 className="font-medium">{selectedResult.title}</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyUrl}
                className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
                title="Copy URL"
              >
                <Copy size={14} />
                {isCopied && <span className="ml-1">Copied!</span>}
              </button>
              <a 
                href={selectedResult.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-primary hover:underline"
                title="Open in new tab"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
          
          <p className="mt-2 text-sm text-muted-foreground">
            {selectedResult.description}
          </p>
          
          {onCodeImport && (
            <button
              onClick={handleImportCode}
              className="mt-4 inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Code size={14} className="mr-1.5" />
              Import Code Example
            </button>
          )}
        </div>
      )}
    </div>
  );
}