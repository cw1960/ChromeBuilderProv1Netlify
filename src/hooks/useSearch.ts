import { useState, useCallback, useEffect } from 'react';
import { SearchResult, SearchOptions } from '@/lib/search-api';

interface UseSearchProps {
  initialQuery?: string;
  type?: 'web' | 'docs' | 'code';
}

interface UseSearchReturn {
  isLoading: boolean;
  error: Error | null;
  results: SearchResult[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  search: (query?: string) => Promise<SearchResult[]>;
  searchMore: () => Promise<SearchResult[]>;
}

export default function useSearch({ 
  initialQuery = '', 
  type = 'web'
}: UseSearchProps = {}): UseSearchReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const search = useCallback(
    async (query?: string): Promise<SearchResult[]> => {
      if (!mounted) return [];

      const queryToUse = query || searchQuery;
      if (!queryToUse) return [];

      setIsLoading(true);
      setError(null);
      setOffset(0);

      try {
        const params = new URLSearchParams({
          q: queryToUse,
          ...(type !== 'web' ? { type } : {}),
          count: '10',
          offset: '0',
        });

        const response = await fetch(`/api/search?${params.toString()}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to perform search');
        }

        const data = await response.json();
        setResults(data.results);
        setOffset(10);
        setHasMore(data.results.length === 10);
        
        if (query) {
          setSearchQuery(query);
        }
        
        return data.results;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, type, mounted]
  );

  const searchMore = useCallback(async (): Promise<SearchResult[]> => {
    if (!mounted || !searchQuery || !hasMore || isLoading) return [];

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        ...(type !== 'web' ? { type } : {}),
        count: '10',
        offset: offset.toString(),
      });

      const response = await fetch(`/api/search?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load more results');
      }

      const data = await response.json();
      const newResults = [...results, ...data.results];
      
      setResults(newResults);
      setOffset(offset + 10);
      setHasMore(data.results.length === 10);
      
      return data.results;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, type, offset, hasMore, isLoading, results, mounted]);

  return {
    isLoading,
    error,
    results,
    searchQuery,
    setSearchQuery,
    search,
    searchMore,
  };
}