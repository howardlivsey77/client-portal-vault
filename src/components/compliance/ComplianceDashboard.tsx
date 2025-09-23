import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ComplianceMonitoringService, type ComplianceMetrics } from '@/services/compliance/complianceMonitoringService';


export const ComplianceDashboard: React.FC = () => {
  const { data: complianceMetrics, isLoading } = useQuery({
    queryKey: ['compliance-metrics'],
    queryFn: async (): Promise<ComplianceMetrics> => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      return await ComplianceMonitoringService.getComplianceMetrics(thirtyDaysAgo, new Date());
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['recent-audit-logs'],
    queryFn: () => ComplianceMonitoringService.getRecentEvents(10),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  const complianceScore = complianceMetrics ? 
    Math.round((1 - (complianceMetrics.anomalousActivity / Math.max(complianceMetrics.totalDataAccess, 1))) * 100) : 95;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 90) return 'default';
    if (score >= 80) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Dashboard</h1>
          <p className="text-muted-foreground">Monitor data governance and privacy compliance</p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Compliance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Overall Compliance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-4xl font-bold ${getScoreColor(complianceScore)}`}>
                {complianceScore}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Based on data access patterns and policy adherence
              </p>
            </div>
            <Badge variant={getScoreBadgeVariant(complianceScore)} className="text-lg px-4 py-2">
              {complianceScore >= 90 ? 'Excellent' : complianceScore >= 80 ? 'Good' : 'Needs Attention'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Data Access</p>
                <p className="text-2xl font-bold">{complianceMetrics?.totalDataAccess.toLocaleString() || '0'}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sensitive Data Access</p>
                <p className="text-2xl font-bold text-orange-600">
                  {complianceMetrics?.sensitiveDataAccess.toLocaleString() || '0'}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Requires monitoring</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data Exports</p>
                <p className="text-2xl font-bold text-blue-600">
                  {complianceMetrics?.dataExports.toLocaleString() || '0'}
                </p>
              </div>
              <Download className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Privacy requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Anomalous Activity</p>
                <p className="text-2xl font-bold text-red-600">
                  {complianceMetrics?.anomalousActivity.toLocaleString() || '0'}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Requires investigation</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audit Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Audit Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditLogs && auditLogs.length > 0 ? (
                auditLogs.slice(0, 5).map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {event.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {event.severity.toUpperCase()}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent audit activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Privacy Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Privacy Requests Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Data Export Completed</p>
                    <p className="text-xs text-muted-foreground">Employee ID: EMP-001</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-600">Completed</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium">Erasure Request Pending</p>
                    <p className="text-xs text-muted-foreground">Employee ID: EMP-002</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-yellow-600 text-white">Pending</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Data Export In Progress</p>
                    <p className="text-xs text-muted-foreground">Employee ID: EMP-003</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-blue-600 text-white">Processing</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Compliance Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {complianceMetrics?.anomalousActivity > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">
                    {complianceMetrics.anomalousActivity} anomalous access patterns detected
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Review unusual data access patterns and investigate potential security concerns.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Regular audit log reviews recommended
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Schedule weekly reviews of sensitive data access patterns to maintain compliance.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  Data retention policies are active
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Your automated data retention policies are helping maintain compliance.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};