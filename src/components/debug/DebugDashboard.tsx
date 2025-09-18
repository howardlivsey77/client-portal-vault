import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bug, Activity, Network, AlertTriangle, Zap } from 'lucide-react';
import { NetworkDiagnosticsPanel } from './NetworkDiagnosticsPanel';
import { NetworkInterceptor } from './NetworkInterceptor';
import { ErrorCategorizer } from './ErrorCategorizer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function DebugDashboard() {
  const [errors, setErrors] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);

  const runInvitationTest = async () => {
    const testPayload = {
      email: 'debug-test@example.com',
      inviteCode: 'DEBUG-TEST-' + Math.random().toString(36).substr(2, 6),
      role: 'user',
      companyId: null,
      test: true,
      skipSend: true
    };

    try {
      console.log('=== STARTING INVITATION DEBUG TEST ===');
      console.log('Test payload:', testPayload);
      console.log('Domain:', window.location.hostname);
      console.log('Origin:', window.location.origin);

      const { data, error } = await supabase.functions.invoke('send-invitation-email', {
        body: testPayload,
        headers: {
          'Content-Type': 'application/json',
          'x-debug-test': 'true'
        }
      });

      const result = {
        timestamp: new Date(),
        success: !error,
        data,
        error,
        payload: testPayload,
        domain: window.location.hostname
      };

      setTestResults(prev => [result, ...prev.slice(0, 9)]);

      if (error) {
        setErrors(prev => [{ ...error, context: 'invitation-test', timestamp: new Date() }, ...prev.slice(0, 9)]);
        toast.error('Test failed: ' + error.message);
      } else {
        toast.success('Test completed successfully');
      }

      console.log('=== TEST COMPLETED ===', result);
    } catch (error) {
      console.error('Test exception:', error);
      setErrors(prev => [{ ...error, context: 'invitation-test-exception', timestamp: new Date() }, ...prev.slice(0, 9)]);
      toast.error('Test threw exception: ' + error);
    }
  };

  const runConnectivityTest = async () => {
    const tests = [
      {
        name: 'Supabase Health Check',
        test: async () => {
          const { data } = await supabase.auth.getSession();
          return { success: true, data: { hasSession: !!data.session } };
        }
      },
      {
        name: 'Database Connection',
        test: async () => {
          const { data, error } = await supabase.from('profiles').select('count').limit(1);
          return { success: !error, data, error };
        }
      },
      {
        name: 'Edge Functions Reachability',
        test: async () => {
          const { data, error } = await supabase.functions.invoke('send-invitation-email', {
            body: { ping: true, skipSend: true }
          });
          return { success: !error, data, error };
        }
      }
    ];

    for (const { name, test } of tests) {
      try {
        const result = await test();
        setTestResults(prev => [{ 
          timestamp: new Date(), 
          test: name, 
          ...result,
          domain: window.location.hostname
        }, ...prev.slice(0, 9)]);
        
        if (!result.success && 'error' in result && result.error) {
          setErrors(prev => [{ 
            ...result.error, 
            context: name, 
            timestamp: new Date() 
          }, ...prev.slice(0, 9)]);
        }
      } catch (error) {
        setTestResults(prev => [{ 
          timestamp: new Date(), 
          test: name, 
          success: false, 
          error,
          domain: window.location.hostname
        }, ...prev.slice(0, 9)]);
        
        setErrors(prev => [{ 
          ...error, 
          context: name, 
          timestamp: new Date() 
        }, ...prev.slice(0, 9)]);
      }
    }

    toast.info('Connectivity tests completed');
  };

  const retryOperation = async (error: any) => {
    console.log('Retrying operation for error:', error);
    if (error.context === 'invitation-test') {
      await runInvitationTest();
    } else {
      await runConnectivityTest();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-6 w-6" />
            Phase 3: Network Debugging Dashboard
          </CardTitle>
          <CardDescription>
            Comprehensive debugging tools for invitation system network issues
          </CardDescription>
          <div className="flex gap-2">
            <Button onClick={runInvitationTest} size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Test Invitation Function
            </Button>
            <Button onClick={runConnectivityTest} variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              Test Connectivity
            </Button>
            <Badge variant="outline" className="ml-auto">
              Domain: {window.location.hostname}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="diagnostics" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="diagnostics">System Diagnostics</TabsTrigger>
          <TabsTrigger value="network">Network Monitor</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
          <TabsTrigger value="tests">Test Results</TabsTrigger>
          <TabsTrigger value="logs">Live Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnostics">
          <NetworkDiagnosticsPanel />
        </TabsContent>

        <TabsContent value="network">
          <NetworkInterceptor />
        </TabsContent>

        <TabsContent value="errors">
          <ErrorCategorizer errors={errors} onRetry={retryOperation} />
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Test Results History</CardTitle>
              <CardDescription>
                Manual test results and automated diagnostics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No test results yet. Run some tests to see results here.
                </div>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={result.success ? 'default' : 'destructive'}>
                            {result.success ? 'PASS' : 'FAIL'}
                          </Badge>
                          <span className="font-medium">{result.test || 'Invitation Test'}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {result.domain}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {result.timestamp.toLocaleString()}
                      </div>
                      {result.error && (
                        <div className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">
                          {result.error.message || result.error.toString()}
                        </div>
                      )}
                      {result.data && (
                        <details className="text-xs mt-2">
                          <summary className="cursor-pointer text-muted-foreground">View details</summary>
                          <pre className="bg-muted p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Live Console Monitoring
              </CardTitle>
              <CardDescription>
                Real-time console output and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Console logs are automatically captured and displayed in the browser console.</p>
                <p className="text-xs mt-2">
                  Open browser DevTools → Console to view real-time logs from all debugging components.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}