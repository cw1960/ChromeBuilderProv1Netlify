import { useState, useCallback, FormEvent, KeyboardEvent, useEffect } from 'react';
import useSearch from '@/hooks/useSearch';
import { SearchIcon, X } from 'lucide-react';

interface SearchBoxProps {
  type?: 'web' | 'docs' | 'code';
  placeholder?: string;
  onResultSelect?: (result: any) => void;
  className?: string;
}

export default function SearchBox({
  type = 'web',
  placeholder = 'Search',
  onResultSelect,
  className = '',
}: SearchBoxProps) {
  const {
    isLoading,
    error,
    results,
    searchQuery,
    setSearchQuery,
    search,
  } = useSearch({ type });
  
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        await search();
        setIsOpen(true);
      }
    },
    [search, searchQuery]
  );
  
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    []
  );
  
  const handleClear = useCallback(() => {
    setSearchQuery('');
    setIsOpen(false);
  }, [setSearchQuery]);
  
  const handleResultClick = useCallback(
    (result: any) => {
      if (onResultSelect) {
        onResultSelect(result);
        setIsOpen(false);
      }
    },
    [onResultSelect]
  );

  if (!mounted) {
    return null;
  }
  
  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder={placeholder}
            className="w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <SearchIcon size={16} />
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </form>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          {isLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}
          
          {error && (
            <div className="p-4 text-center text-sm text-destructive">
              {error.message}
            </div>
          )}
          
          {!isLoading && !error && results.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found
            </div>
          )}
          
          {results.length > 0 && (
            <ul className="max-h-[60vh] overflow-auto py-2">
              {results.map((result, index) => (
                <li key={`${result.url}-${index}`}>
                  <button
                    type="button"
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-2 text-left hover:bg-muted"
                  >
                    <h3 className="font-medium text-primary line-clamp-1">{result.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{result.url}</p>
                    <p className="mt-1 text-xs text-foreground line-clamp-2">{result.description}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          
          <div className="border-t border-border p-2 text-center text-xs text-muted-foreground">
            Powered by Brave Search
          </div>
        </div>
      )}
    </div>
  );
}