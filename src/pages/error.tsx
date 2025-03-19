import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import { ErrorType } from '@/lib/error-handler';

export default function ErrorPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [systemStatus, setSystemStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  const [showDetails, setShowDetails] = useState(false);
  
  // Get error details from URL parameters
  const message = typeof router.query.message === 'string' ? router.query.message : 'An error occurred';
  const errorType = typeof router.query.type === 'string' ? router.query.type as ErrorType : ErrorType.UNKNOWN;
  const errorCode = router.query.code ? String(router.query.code) : undefined;
  const projectId = typeof router.query.projectId === 'string' ? router.query.projectId : undefined;
  
  const timestamp = new Date().toISOString();
  
  // Generate recovery suggestions based on error type
  const getRecoverySuggestions = () => {
    switch (errorType) {
      case ErrorType.AUTHENTICATION:
        return [
          'Try signing in again',
          'Check if your account has the necessary permissions',
          'Contact support if the issue persists'
        ];
      case ErrorType.AUTHORIZATION:
        return [
          'Request access to the resource',
          'Check if your account has the necessary permissions',
          'Contact the resource owner or administrator'
        ];
      case ErrorType.VALIDATION:
        return [
          'Check the provided information for errors',
          'Make sure all required fields are filled',
          'Follow the validation rules specified in the error message'
        ];
      case ErrorType.NOT_FOUND:
        return [
          'Check the URL for typos',
          'The resource may have been moved or deleted',
          'Return to the dashboard and try again'
        ];
      case ErrorType.DATABASE:
        return [
          'Try again in a few moments',
          'Check your database connection',
          'Verify that the database is accessible'
        ];
      case ErrorType.SERVER:
        return [
          'Refresh the page and try again',
          'Wait a few minutes and try again',
          'Contact support if the issue persists'
        ];
      case ErrorType.NETWORK:
        return [
          'Check your internet connection',
          'Try again in a few moments',
          'Contact support if the issue persists'
        ];
      default:
        return [
          'Refresh the page and try again',
          'Return to the dashboard',
          'Contact support if the issue persists'
        ];
    }
  };
  
  const recoverySuggestions = getRecoverySuggestions();
  
  // Check system status
  const checkSystemStatus = async () => {
    try {
      const response = await fetch('/api/debug/system-check');
      if (response.ok) {
        setSystemStatus('online');
      } else {
        setSystemStatus('offline');
      }
    } catch (error) {
      console.error('Error checking system status:', error);
      setSystemStatus('offline');
    }
  };
  
  useEffect(() => {
    checkSystemStatus();
  }, []);
  
  const goToDashboard = () => {
    router.push('/dashboard');
  };
  
  const goBack = () => {
    router.back();
  };
  
  const goToProject = () => {
    if (projectId) {
      router.push(`/dashboard/project?projectId=${projectId}`);
    } else {
      router.push('/dashboard');
    }
  };
  
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className={`w-full max-w-2xl p-8 rounded-lg shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center mb-6">
          <div className={`p-3 rounded-full mr-4 ${theme === 'dark' ? 'bg-red-900' : 'bg-red-100'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${theme === 'dark' ? 'text-red-500' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Error</h1>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{message}</h2>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {errorCode ? `Error code: ${errorCode}` : 'An error occurred while processing your request.'}
          </p>
        </div>
        
        <div className="mb-6">
          <h3 className="font-semibold mb-2">What can you do?</h3>
          <ul className={`list-disc pl-5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {recoverySuggestions.map((suggestion, index) => (
              <li key={index} className="mb-1">{suggestion}</li>
            ))}
          </ul>
        </div>
        
        <div className={`p-4 rounded mb-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center mb-2">
            <div className={`h-3 w-3 rounded-full mr-2 ${
              systemStatus === 'loading' ? 'bg-yellow-400' :
              systemStatus === 'online' ? 'bg-green-500' :
              'bg-red-500'
            }`}></div>
            <h3 className="font-semibold">System Status: {
              systemStatus === 'loading' ? 'Checking...' :
              systemStatus === 'online' ? 'All Systems Operational' :
              'Some Systems Offline'
            }</h3>
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {systemStatus === 'offline' ? 
              'We\'re experiencing some technical difficulties. Please try again later.' :
              'If the issue persists, please contact support.'
            }
          </p>
        </div>
        
        <div className="mb-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`text-sm flex items-center ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showDetails ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
            </svg>
            {showDetails ? 'Hide Technical Details' : 'Show Technical Details'}
          </button>
          
          {showDetails && (
            <div className={`mt-2 p-3 rounded text-sm font-mono overflow-x-auto ${theme === 'dark' ? 'bg-gray-900 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
              <p>Error Type: {errorType}</p>
              <p>Error Code: {errorCode || 'N/A'}</p>
              <p>Project ID: {projectId || 'N/A'}</p>
              <p>Timestamp: {timestamp}</p>
              <p>Browser: {typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'}</p>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={goBack}
            className={`px-4 py-2 rounded transition-colors ${
              theme === 'dark' ? 
              'bg-gray-700 text-white hover:bg-gray-600' : 
              'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Go Back
          </button>
          <button 
            onClick={goToDashboard}
            className={`px-4 py-2 rounded transition-colors ${
              theme === 'dark' ? 
              'bg-blue-600 text-white hover:bg-blue-500' : 
              'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Go to Dashboard
          </button>
          {projectId && (
            <button 
              onClick={goToProject}
              className={`px-4 py-2 rounded transition-colors ${
                theme === 'dark' ? 
                'bg-blue-600 text-white hover:bg-blue-500' : 
                'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Go to Project
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>If you continue to experience issues, please contact support.</p>
      </div>
    </div>
  );
} 