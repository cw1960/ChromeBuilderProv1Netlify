// Removing the dependency on @smithery/client
// import { searchBrave } from '@smithery/client';

// Interface for search results
export interface SearchResult {
  title: string;
  url: string;
  description: string;
  isNavigational: boolean;
  deepLinks?: Array<{
    title: string;
    url: string;
    description?: string;
  }>;
  imageUrl?: string;
  source?: string;
}

// Interface for search options
export interface SearchOptions {
  count?: number;
  offset?: number;
  country?: string;
  language?: string;
  safeSearch?: 'off' | 'moderate' | 'strict';
  spellcheck?: boolean;
  freshness?: 'day' | 'week' | 'month';
  textDecorations?: boolean;
  textFormat?: 'html' | 'raw';
}

/**
 * Perform a web search using Brave Search API
 * 
 * @param query The search query
 * @param options Search options
 * @returns Promise with search results
 */
export async function webSearch(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  try {
    // Mock implementation for development
    console.log('Mock web search for:', query, options);
    
    // Return mock search results
    return [
      {
        title: 'Chrome Extension Development - Chrome Developers',
        url: 'https://developer.chrome.com/docs/extensions/',
        description: 'Learn how to develop extensions for Chrome browser. This documentation provides guides, API references, and examples.',
        isNavigational: true,
        deepLinks: [
          {
            title: 'Getting Started',
            url: 'https://developer.chrome.com/docs/extensions/mv3/getstarted/',
            description: 'A step-by-step guide to creating your first Chrome extension.'
          },
          {
            title: 'API Reference',
            url: 'https://developer.chrome.com/docs/extensions/reference/',
            description: 'Complete reference for Chrome extension APIs.'
          }
        ],
        source: 'mock'
      },
      {
        title: 'Manifest V3 Overview - Chrome Developers',
        url: 'https://developer.chrome.com/docs/extensions/mv3/intro/',
        description: 'An overview of Manifest V3 for Chrome Extensions, including key concepts and migration guide.',
        isNavigational: false,
        source: 'mock'
      },
      {
        title: 'Chrome Extension Examples - GitHub',
        url: 'https://github.com/GoogleChrome/chrome-extensions-samples',
        description: 'A collection of sample Chrome extensions demonstrating various features and APIs.',
        isNavigational: false,
        source: 'mock'
      }
    ];
  } catch (error) {
    console.error('Error performing web search:', error);
    throw new Error('Failed to search the web: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Search for Chrome extension development resources
 * 
 * @param query The search query
 * @returns Promise with search results relevant to Chrome extension development
 */
export async function searchChromeExtensionDocs(query: string): Promise<SearchResult[]> {
  // Add Chrome extension specific context to the query
  const enhancedQuery = `${query} chrome extension developer documentation`;
  
  try {
    const results = await webSearch(enhancedQuery, {
      count: 5,
      textFormat: 'html',
    });
    
    // Filter for more relevant results
    return results.filter(result => {
      const lowerUrl = result.url.toLowerCase();
      const lowerTitle = result.title.toLowerCase();
      const lowerDesc = result.description.toLowerCase();
      
      // Check if result is from a trusted source for Chrome extension documentation
      return (
        lowerUrl.includes('developer.chrome.com') ||
        lowerUrl.includes('developers.google.com') ||
        lowerUrl.includes('mozilla.org/en-US/docs') ||
        lowerUrl.includes('github.com/chromium') ||
        lowerUrl.includes('chromium.org') ||
        (lowerTitle.includes('chrome') && 
         (lowerTitle.includes('extension') || lowerTitle.includes('plugin') || lowerTitle.includes('manifest'))) ||
        (lowerDesc.includes('chrome') && 
         (lowerDesc.includes('extension') || lowerDesc.includes('plugin') || lowerDesc.includes('manifest')))
      );
    });
  } catch (error) {
    console.error('Error searching Chrome extension docs:', error);
    throw new Error('Failed to search Chrome extension documentation: ' + 
      (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Search for code examples related to Chrome extensions
 * 
 * @param query The search query
 * @returns Promise with search results containing code examples
 */
export async function searchCodeExamples(query: string): Promise<SearchResult[]> {
  // Add code example context to the query
  const enhancedQuery = `${query} chrome extension code example github`;
  
  try {
    const results = await webSearch(enhancedQuery, {
      count: 8,
      textFormat: 'html',
    });
    
    // Filter for more relevant code examples
    return results.filter(result => {
      const lowerUrl = result.url.toLowerCase();
      const lowerTitle = result.title.toLowerCase();
      
      // Check if result is likely to contain code
      return (
        lowerUrl.includes('github.com') ||
        lowerUrl.includes('stackoverflow.com') ||
        lowerUrl.includes('codepen.io') ||
        lowerUrl.includes('jsfiddle.net') ||
        lowerUrl.includes('gist.github.com') ||
        lowerTitle.includes('example') ||
        lowerTitle.includes('sample') ||
        lowerTitle.includes('code') ||
        lowerTitle.includes('tutorial')
      );
    });
  } catch (error) {
    console.error('Error searching code examples:', error);
    throw new Error('Failed to search code examples: ' + 
      (error instanceof Error ? error.message : String(error)));
  }
}