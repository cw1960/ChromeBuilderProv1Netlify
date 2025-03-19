import { NextApiResponse } from 'next';
import { NextRouter } from 'next/router';

// Error types
export enum ErrorType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  DATABASE = 'database',
  SERVER = 'server',
  NETWORK = 'network',
  UNKNOWN = 'unknown'
}

// Error severity levels
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Error interface
export interface AppError {
  message: string;
  type: ErrorType;
  severity: ErrorSeverity;
  code?: number | string;
  details?: any;
  timestamp: string;
  endpoint?: string;
  recoverable?: boolean;
}

/**
 * Error Handler class for standardized error handling across the application
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: AppError[] = [];
  private maxErrorsStored: number = 50;

  private constructor() {
    console.log('[ErrorHandler] Initialized');
  }

  /**
   * Get the singleton instance of ErrorHandler
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Create a standardized error object
   */
  public createError(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    code?: number | string,
    details?: any,
    endpoint?: string,
    recoverable: boolean = false
  ): AppError {
    const error: AppError = {
      message,
      type,
      severity,
      code,
      details,
      timestamp: new Date().toISOString(),
      endpoint,
      recoverable
    };

    // Store error in history
    this.storeError(error);

    // Log error to console
    this.logError(error);

    return error;
  }

  /**
   * Store error in history
   */
  private storeError(error: AppError): void {
    this.errors.unshift(error);
    
    // Limit the number of stored errors
    if (this.errors.length > this.maxErrorsStored) {
      this.errors = this.errors.slice(0, this.maxErrorsStored);
    }
  }

  /**
   * Log error to console
   */
  private logError(error: AppError): void {
    const logPrefix = `[ErrorHandler] [${error.type.toUpperCase()}] [${error.severity.toUpperCase()}]`;
    
    if (error.severity === ErrorSeverity.CRITICAL) {
      console.error(`${logPrefix} ${error.message}`, error.details || '');
    } else if (error.severity === ErrorSeverity.ERROR) {
      console.error(`${logPrefix} ${error.message}`, error.details || '');
    } else if (error.severity === ErrorSeverity.WARNING) {
      console.warn(`${logPrefix} ${error.message}`, error.details || '');
    } else {
      console.info(`${logPrefix} ${error.message}`, error.details || '');
    }
  }

  /**
   * Get all stored errors
   */
  public getErrors(): AppError[] {
    return [...this.errors];
  }

  /**
   * Clear all stored errors
   */
  public clearErrors(): void {
    this.errors = [];
  }

  /**
   * Handle API error response
   */
  public handleApiError(
    res: NextApiResponse,
    error: Error | string | any,
    statusCode: number = 500,
    type: ErrorType = ErrorType.SERVER,
    endpoint?: string
  ): void {
    const message = error instanceof Error ? error.message : String(error);
    
    const appError = this.createError(
      message,
      type,
      statusCode >= 500 ? ErrorSeverity.ERROR : ErrorSeverity.WARNING,
      statusCode,
      error,
      endpoint
    );
    
    res.status(statusCode).json({
      message: appError.message,
      error: {
        type: appError.type,
        code: appError.code,
        timestamp: appError.timestamp
      }
    });
  }

  /**
   * Handle client-side error and redirect to error page
   */
  public handleClientError(
    router: NextRouter,
    error: Error | string | any,
    type: ErrorType = ErrorType.UNKNOWN,
    code: number = 500,
    projectId?: string
  ): void {
    const message = error instanceof Error ? error.message : String(error);
    
    const appError = this.createError(
      message,
      type,
      code >= 500 ? ErrorSeverity.ERROR : ErrorSeverity.WARNING,
      code,
      error
    );
    
    // Construct error page URL
    const errorUrl = `/error?message=${encodeURIComponent(appError.message)}&code=${appError.code}&type=${appError.type}${projectId ? `&projectId=${projectId}` : ''}`;
    
    // Redirect to error page
    router.push(errorUrl);
  }

  /**
   * Check system status
   */
  public async checkSystemStatus(): Promise<boolean> {
    try {
      const response = await fetch('/api/debug/system-check');
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.status?.database?.status === 'Connected';
    } catch (error) {
      console.error('[ErrorHandler] Error checking system status:', error);
      return false;
    }
  }

  /**
   * Get user-friendly error message based on error type and code
   */
  public getFriendlyErrorMessage(type: ErrorType, code?: number | string): string {
    switch (type) {
      case ErrorType.AUTHENTICATION:
        return 'You need to sign in to access this resource.';
      
      case ErrorType.AUTHORIZATION:
        return 'You do not have permission to access this resource.';
      
      case ErrorType.VALIDATION:
        return 'The provided data is invalid or incomplete.';
      
      case ErrorType.NOT_FOUND:
        return 'The requested resource could not be found.';
      
      case ErrorType.DATABASE:
        return 'There was an issue with the database operation.';
      
      case ErrorType.NETWORK:
        return 'Network connection issue. Please check your internet connection.';
      
      case ErrorType.SERVER:
        if (code === 500) {
          return 'The server encountered an unexpected error. Please try again later.';
        }
        return 'There was an issue with the server.';
      
      case ErrorType.UNKNOWN:
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }

  /**
   * Get recovery suggestions based on error type
   */
  public getRecoverySuggestions(type: ErrorType): string[] {
    switch (type) {
      case ErrorType.AUTHENTICATION:
        return [
          'Sign in to your account',
          'Check if your session has expired',
          'Clear your browser cookies and try again'
        ];
      
      case ErrorType.AUTHORIZATION:
        return [
          'Check if you have the necessary permissions',
          'Contact an administrator if you need access',
          'Try signing in with a different account'
        ];
      
      case ErrorType.VALIDATION:
        return [
          'Check the provided information for errors',
          'Ensure all required fields are filled out',
          'Try again with valid data'
        ];
      
      case ErrorType.NOT_FOUND:
        return [
          'Check if the URL is correct',
          'The resource may have been moved or deleted',
          'Return to the dashboard and try again'
        ];
      
      case ErrorType.DATABASE:
        return [
          'Try again in a few moments',
          'Refresh the page',
          'Contact support if the issue persists'
        ];
      
      case ErrorType.NETWORK:
        return [
          'Check your internet connection',
          'Refresh the page',
          'Try again in a few moments'
        ];
      
      case ErrorType.SERVER:
        return [
          'Refresh the page',
          'Try again in a few moments',
          'Contact support if the issue persists'
        ];
      
      case ErrorType.UNKNOWN:
      default:
        return [
          'Refresh the page',
          'Try again later',
          'Clear your browser cache',
          'Contact support if the issue persists'
        ];
    }
  }
} 