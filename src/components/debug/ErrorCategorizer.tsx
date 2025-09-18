import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Bug, Network, Shield, Server, RefreshCw } from 'lucide-react';
import { logger } from '@/services/loggingService';

export type ErrorCategory = 'CORS' | 'AUTH' | 'NETWORK' | 'FUNCTION' | 'UNKNOWN';

interface CategorizedError {
  category: ErrorCategory;
  title: string;
  description: string;
  remediation: string[];
  retryStrategy: 'immediate' | 'exponential' | 'manual';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class ErrorCategorizerService {
  static categorizeError(error: any, context?: string): CategorizedError {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const errorCode = error?.code || error?.status;
    
    logger.debug('Categorizing error', { error, context, errorMessage, errorCode }, 'ErrorCategorizer');

    // CORS Errors
    if (errorMessage.includes('CORS') || 
        errorMessage.includes('cross-origin') ||
        errorMessage.includes('Access-Control-Allow') ||
        errorCode === 'CORS_ERROR') {
      return {
        category: 'CORS',
        title: 'Cross-Origin Request Blocked',
        description: 'Browser is blocking the request due to CORS policy',
        remediation: [
          'Check if the domain is correctly configured',
          'Verify CORS headers in edge function',
          'Ensure request includes proper credentials',
          'Test from the original domain (client-portal-vault.lovable.app)'
        ],
        retryStrategy: 'manual',
        priority: 'high'
      };
    }

    // Authentication Errors
    if (errorMessage.includes('unauthorized') ||
        errorMessage.includes('invalid_grant') ||
        errorMessage.includes('token') ||
        errorCode === 401 ||
        errorCode === 403) {
      return {
        category: 'AUTH',
        title: 'Authentication Failed',
        description: 'Request failed due to authentication issues',
        remediation: [
          'Check if user is properly logged in',
          'Verify auth token is present and valid',
          'Check token expiration',
          'Try refreshing the session'
        ],
        retryStrategy: 'immediate',
        priority: 'critical'
      };
    }

    // Network/DNS Errors
    if (errorMessage.includes('fetch') ||
        errorMessage.includes('network') ||
        errorMessage.includes('DNS') ||
        errorMessage.includes('timeout') ||
        errorCode === 'NETWORK_ERROR' ||
        errorCode === 'TIMEOUT') {
      return {
        category: 'NETWORK',
        title: 'Network Connectivity Issue',
        description: 'Failed to reach the server or DNS resolution failed',
        remediation: [
          'Check internet connection',
          'Verify DNS resolution for supabase domain',
          'Test from different network/device',
          'Check if corporate firewall is blocking requests'
        ],
        retryStrategy: 'exponential',
        priority: 'high'
      };
    }

    // Edge Function Errors
    if (context?.includes('function') ||
        errorMessage.includes('function') ||
        errorMessage.includes('edge') ||
        errorCode >= 500) {
      return {
        category: 'FUNCTION',
        title: 'Edge Function Error',
        description: 'The serverless function encountered an error',
        remediation: [
          'Check edge function logs in Supabase dashboard',
          'Verify function is deployed and accessible',
          'Check function environment variables',
          'Test function with minimal payload'
        ],
        retryStrategy: 'exponential',
        priority: 'medium'
      };
    }

    // Default unknown error
    return {
      category: 'UNKNOWN',
      title: 'Unclassified Error',
      description: `Error: ${errorMessage}`,
      remediation: [
        'Check browser console for more details',
        'Try refreshing the page',
        'Test from different browser/device',
        'Contact support with error details'
      ],
      retryStrategy: 'manual',
      priority: 'medium'
    };
  }

  static async implementRetryStrategy(
    operation: () => Promise<any>,
    strategy: 'immediate' | 'exponential' | 'manual',
    maxAttempts: number = 3
  ): Promise<any> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          logger.info(`Retry attempt ${attempt}/${maxAttempts}`, null, 'ErrorCategorizer');
          
          if (strategy === 'exponential') {
            const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s, 8s...
            await new Promise(resolve => setTimeout(resolve, delay));
          } else if (strategy === 'immediate') {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        const result = await operation();
        if (attempt > 1) {
          logger.info(`Operation succeeded on attempt ${attempt}`, null, 'ErrorCategorizer');
        }
        return result;
      } catch (error) {
        lastError = error;
        logger.warn(`Operation failed on attempt ${attempt}`, error, 'ErrorCategorizer');
        
        if (strategy === 'manual') {
          break; // Don't retry manual errors
        }
      }
    }

    throw lastError;
  }
}

interface ErrorCategorizerProps {
  errors: any[];
  onRetry?: (error: any) => void;
}

export function ErrorCategorizer({ errors, onRetry }: ErrorCategorizerProps) {
  const [selectedError, setSelectedError] = useState<number | null>(null);

  const categorizedErrors = errors.map((error, index) => ({
    index,
    original: error,
    categorized: ErrorCategorizerService.categorizeError(error, error.context)
  }));

  const getErrorIcon = (category: ErrorCategory) => {
    switch (category) {
      case 'CORS': return <Shield className="h-4 w-4" />;
      case 'AUTH': return <Shield className="h-4 w-4" />;
      case 'NETWORK': return <Network className="h-4 w-4" />;
      case 'FUNCTION': return <Server className="h-4 w-4" />;
      default: return <Bug className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Error Analysis & Categorization
        </CardTitle>
        <CardDescription>
          Automatic error classification with remediation suggestions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {categorizedErrors.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No errors to analyze
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {categorizedErrors.map(({ index, categorized, original }) => (
                <Card 
                  key={index} 
                  className={`cursor-pointer transition-colors ${selectedError === index ? 'border-primary' : ''}`}
                  onClick={() => setSelectedError(selectedError === index ? null : index)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getErrorIcon(categorized.category)}
                        <div>
                          <div className="font-medium">{categorized.title}</div>
                          <div className="text-sm text-muted-foreground">{categorized.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(categorized.priority) as any}>
                          {categorized.priority}
                        </Badge>
                        <Badge variant="outline">{categorized.category}</Badge>
                        {onRetry && categorized.retryStrategy !== 'manual' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRetry(original);
                            }}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedError !== null && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">Recommended Actions:</div>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {categorizedErrors[selectedError].categorized.remediation.map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                    <div className="text-xs text-muted-foreground mt-2">
                      <strong>Retry Strategy:</strong> {categorizedErrors[selectedError].categorized.retryStrategy}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}