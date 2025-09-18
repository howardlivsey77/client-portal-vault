import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Clock, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { networkDiagnostics, NetworkDiagnostics } from '@/services/networkDiagnostics';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function NetworkDiagnosticsPanel() {
  const [diagnostics, setDiagnostics] = useState<NetworkDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<NetworkDiagnostics[]>([]);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const result = await networkDiagnostics.runComprehensiveDiagnostics();
      setDiagnostics(result);
      setHistory(networkDiagnostics.getHistoricalDiagnostics());
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  const testInvitationFunction = async () => {
    const testPayload = {
      email: 'test@example.com',
      inviteCode: 'test-code-123',
      role: 'user',
      test: true,
      skipSend: true
    };

    const result = await networkDiagnostics.testEdgeFunctionDirect('send-invitation-email', testPayload);
    console.log('Direct function test result:', result);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const StatusIcon = ({ status }: { status: boolean }) => 
    status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />;

  const formatLatency = (ms: number) => {
    if (ms < 100) return <Badge variant="secondary" className="text-green-600">Fast ({ms.toFixed(0)}ms)</Badge>;
    if (ms < 500) return <Badge variant="secondary" className="text-yellow-600">OK ({ms.toFixed(0)}ms)</Badge>;
    return <Badge variant="destructive">Slow ({ms.toFixed(0)}ms)</Badge>;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Network Diagnostics Panel
        </CardTitle>
        <CardDescription>
          Phase 3: Direct network debugging and health monitoring
        </CardDescription>
        <div className="flex gap-2">
          <Button onClick={runDiagnostics} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Run Diagnostics
          </Button>
          <Button onClick={testInvitationFunction} variant="outline" size="sm">
            Test Invitation Function
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!diagnostics ? (
          <div className="text-center py-8">
            <Button onClick={runDiagnostics} disabled={loading}>
              {loading ? 'Running Diagnostics...' : 'Start Diagnostics'}
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="environment">Environment</TabsTrigger>
              <TabsTrigger value="supabase">Supabase</TabsTrigger>
              <TabsTrigger value="auth">Authentication</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Domain:</strong> {diagnostics.domain} | 
                  <strong> Timestamp:</strong> {diagnostics.timestamp.toLocaleString()}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <StatusIcon status={diagnostics.supabaseHealth.client} />
                    </div>
                    <div className="text-sm font-medium">Supabase Client</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <StatusIcon status={diagnostics.authState.hasSession} />
                    </div>
                    <div className="text-sm font-medium">Authentication</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <StatusIcon status={diagnostics.supabaseHealth.functions} />
                    </div>
                    <div className="text-sm font-medium">Edge Functions</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      {diagnostics.networkInfo.online ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="text-sm font-medium">Network Status</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Supabase Latency:</span>
                    {formatLatency(diagnostics.supabaseHealth.latency)}
                  </div>
                  <div className="flex justify-between">
                    <span>DNS Resolution:</span>
                    {formatLatency(diagnostics.dnsInfo.dnsResolutionTime)}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="environment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Browser Environment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Domain:</span>
                    <Badge variant="outline">{diagnostics.domain}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Running in iframe:</span>
                    <StatusIcon status={!diagnostics.isIframe} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>localStorage:</span>
                    <StatusIcon status={diagnostics.localStorage} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>sessionStorage:</span>
                    <StatusIcon status={diagnostics.sessionStorage} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cookies:</span>
                    <StatusIcon status={diagnostics.cookies} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    <strong>User Agent:</strong> {diagnostics.userAgent}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="supabase" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Supabase Health Check</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Client Initialized:</span>
                    <StatusIcon status={diagnostics.supabaseHealth.client} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Auth Service:</span>
                    <StatusIcon status={diagnostics.supabaseHealth.auth} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Database Access:</span>
                    <StatusIcon status={diagnostics.supabaseHealth.database} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Edge Functions:</span>
                    <StatusIcon status={diagnostics.supabaseHealth.functions} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Latency:</span>
                    {formatLatency(diagnostics.supabaseHealth.latency)}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="auth" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Authentication State</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Has Session:</span>
                    <StatusIcon status={diagnostics.authState.hasSession} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Has Token:</span>
                    <StatusIcon status={diagnostics.authState.hasToken} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Token Valid:</span>
                    <StatusIcon status={diagnostics.authState.tokenValid} />
                  </div>
                  {diagnostics.authState.userId && (
                    <div className="text-xs text-muted-foreground">
                      <strong>User ID:</strong> {diagnostics.authState.userId}
                    </div>
                  )}
                  {diagnostics.authState.email && (
                    <div className="text-xs text-muted-foreground">
                      <strong>Email:</strong> {diagnostics.authState.email}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="network" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Network Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Online Status:</span>
                    <StatusIcon status={diagnostics.networkInfo.online} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Supabase Reachable:</span>
                    <StatusIcon status={diagnostics.dnsInfo.supabaseReachable} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>DNS Resolution Time:</span>
                    {formatLatency(diagnostics.dnsInfo.dnsResolutionTime)}
                  </div>
                  {diagnostics.networkInfo.effectiveType && (
                    <div className="flex justify-between items-center">
                      <span>Connection Type:</span>
                      <Badge variant="outline">{diagnostics.networkInfo.effectiveType}</Badge>
                    </div>
                  )}
                  {diagnostics.networkInfo.downlink && (
                    <div className="flex justify-between items-center">
                      <span>Downlink:</span>
                      <Badge variant="outline">{diagnostics.networkInfo.downlink} Mbps</Badge>
                    </div>
                  )}
                  {diagnostics.networkInfo.rtt && (
                    <div className="flex justify-between items-center">
                      <span>RTT:</span>
                      <Badge variant="outline">{diagnostics.networkInfo.rtt} ms</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}