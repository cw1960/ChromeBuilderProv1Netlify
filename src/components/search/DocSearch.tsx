import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import SearchBox from './SearchBox';
import { SearchResult } from '@/lib/search-api';

interface DocSearchProps {
  className?: string;
}

export default function DocSearch({ className = '' }: DocSearchProps) {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleResultSelect = (result: SearchResult) => {
    setSelectedResult(result);
    // Open the URL in a new tab
    if (mounted) {
      window.open(result.url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!mounted) {
    return null;
  }
  
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Search Chrome Extension Documentation</h3>
        <p className="text-sm text-muted-foreground">
          Find official documentation, guides, and examples for Chrome extension development.
        </p>
      </div>
      
      <SearchBox 
        type="docs" 
        placeholder="Search Chrome extension documentation..." 
        onResultSelect={handleResultSelect}
      />
      
      {selectedResult && (
        <div className="mt-4 rounded-md border border-border p-4">
          <div className="flex items-start justify-between">
            <h3 className="font-medium">{selectedResult.title}</h3>
            <a 
              href={selectedResult.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-2 inline-flex items-center text-xs text-primary hover:underline"
            >
              Open <ExternalLink size={12} className="ml-1" />
            </a>
          </div>
          
          <p className="mt-2 text-sm text-muted-foreground">
            {selectedResult.description}
          </p>
          
          {selectedResult.deepLinks && selectedResult.deepLinks.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-medium text-muted-foreground">Related links:</h4>
              <ul className="mt-1 space-y-1">
                {selectedResult.deepLinks.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}