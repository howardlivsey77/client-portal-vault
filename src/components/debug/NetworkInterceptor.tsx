import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network, Clock, AlertCircle, CheckCircle, X, Play, Pause } from 'lucide-react';
import { logger } from '@/services/loggingService';

interface NetworkRequest {
  id: string;
  timestamp: Date;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
  error?: any;
}

export function NetworkInterceptor() {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(null);

  useEffect(() => {
    if (!isRecording) return;

    const originalFetch = window.fetch;
    const requestsMap = new Map<string, NetworkRequest>();

    window.fetch = async (...args) => {
      const requestId = Math.random().toString(36).substr(2, 9);
      const startTime = performance.now();
      const [url, options = {}] = args;
      
      const request: NetworkRequest = {
        id: requestId,
        timestamp: new Date(),
        method: options.method || 'GET',
        url: url.toString(),
        requestHeaders: {},
        responseHeaders: {},
        requestBody: options.body
      };

      // Extract request headers
      if (options.headers) {
        if (options.headers instanceof Headers) {
          options.headers.forEach((value, key) => {
            request.requestHeaders[key] = value;
          });
        } else if (typeof options.headers === 'object') {
          Object.entries(options.headers).forEach(([key, value]) => {
            request.requestHeaders[key] = value as string;
          });
        }
      }

      requestsMap.set(requestId, request);
      
      logger.debug('Network interceptor: Request started', request, 'NetworkInterceptor');

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        // Extract response headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        const clonedResponse = response.clone();
        let responseBody: any;
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            responseBody = await clonedResponse.json();
          } else {
            responseBody = await clonedResponse.text();
          }
        } catch (e) {
          responseBody = 'Unable to parse response body';
        }

        const completedRequest = {
          ...request,
          status: response.status,
          duration,
          responseHeaders,
          responseBody
        };

        setRequests(prev => {
          const newRequests = [completedRequest, ...prev.slice(0, 99)]; // Keep last 100 requests
          return newRequests;
        });

        logger.debug('Network interceptor: Request completed', completedRequest, 'NetworkInterceptor');

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        const failedRequest = {
          ...request,
          duration,
          error: error
        };

        setRequests(prev => {
          const newRequests = [failedRequest, ...prev.slice(0, 99)];
          return newRequests;
        });

        logger.error('Network interceptor: Request failed', { request: failedRequest, error }, 'NetworkInterceptor');

        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [isRecording]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setRequests([]);
    }
  };

  const clearRequests = () => {
    setRequests([]);
  };

  const getStatusColor = (status?: number, error?: any) => {
    if (error) return 'destructive';
    if (!status) return 'secondary';
    if (status >= 200 && status < 300) return 'default';
    if (status >= 300 && status < 400) return 'secondary';
    if (status >= 400) return 'destructive';
    return 'secondary';
  };

  const getStatusIcon = (status?: number, error?: any) => {
    if (error) return <AlertCircle className="h-3 w-3" />;
    if (!status) return <Clock className="h-3 w-3" />;
    if (status >= 200 && status < 400) return <CheckCircle className="h-3 w-3" />;
    return <AlertCircle className="h-3 w-3" />;
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '-';
    if (duration < 1000) return `${duration.toFixed(0)}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const formatHeaders = (headers: Record<string, string>) => {
    return Object.entries(headers).map(([key, value]) => `${key}: ${value}`).join('\n');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Network Request Interceptor
        </CardTitle>
        <CardDescription>
          Real-time network request monitoring and analysis
        </CardDescription>
        <div className="flex gap-2">
          <Button 
            onClick={toggleRecording} 
            variant={isRecording ? 'destructive' : 'default'}
            size="sm"
          >
            {isRecording ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Recording
              </>
            )}
          </Button>
          <Button onClick={clearRequests} variant="outline" size="sm">
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Badge variant={isRecording ? 'default' : 'secondary'}>
            {requests.length} requests
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Request List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Request History</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {requests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {isRecording ? 'No requests captured yet' : 'Start recording to capture requests'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {requests.map((request) => (
                      <div
                        key={request.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedRequest?.id === request.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedRequest(request)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(request.status, request.error)}
                            <Badge variant="outline" className="text-xs">
                              {request.method}
                            </Badge>
                            <Badge variant={getStatusColor(request.status, request.error) as any} className="text-xs">
                              {request.error ? 'ERROR' : request.status || 'PENDING'}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(request.duration)}
                          </span>
                        </div>
                        <div className="text-sm font-mono truncate">
                          {request.url}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {request.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Request Details</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedRequest ? (
                <div className="text-center py-8 text-muted-foreground">
                  Select a request to view details
                </div>
              ) : (
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="request">Request</TabsTrigger>
                    <TabsTrigger value="response">Response</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <strong>Method:</strong> {selectedRequest.method}
                      </div>
                      <div>
                        <strong>Status:</strong> {selectedRequest.status || 'Pending'}
                      </div>
                      <div>
                        <strong>Duration:</strong> {formatDuration(selectedRequest.duration)}
                      </div>
                      <div>
                        <strong>Time:</strong> {selectedRequest.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    <div>
                      <strong>URL:</strong>
                      <div className="text-xs font-mono bg-muted p-2 rounded mt-1 break-all">
                        {selectedRequest.url}
                      </div>
                    </div>
                    {selectedRequest.error && (
                      <div>
                        <strong>Error:</strong>
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-1">
                          {selectedRequest.error.toString()}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="headers">
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        <div>
                          <strong>Request Headers:</strong>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 whitespace-pre-wrap">
                            {formatHeaders(selectedRequest.requestHeaders) || 'None'}
                          </pre>
                        </div>
                        <div>
                          <strong>Response Headers:</strong>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 whitespace-pre-wrap">
                            {formatHeaders(selectedRequest.responseHeaders) || 'None'}
                          </pre>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="request">
                    <ScrollArea className="h-64">
                      <div>
                        <strong>Request Body:</strong>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 whitespace-pre-wrap">
                          {selectedRequest.requestBody ? 
                            (typeof selectedRequest.requestBody === 'string' ? 
                              selectedRequest.requestBody : 
                              JSON.stringify(selectedRequest.requestBody, null, 2)
                            ) : 'No body'
                          }
                        </pre>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="response">
                    <ScrollArea className="h-64">
                      <div>
                        <strong>Response Body:</strong>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 whitespace-pre-wrap">
                          {selectedRequest.responseBody ? 
                            (typeof selectedRequest.responseBody === 'string' ? 
                              selectedRequest.responseBody : 
                              JSON.stringify(selectedRequest.responseBody, null, 2)
                            ) : 'No response body'
                          }
                        </pre>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}