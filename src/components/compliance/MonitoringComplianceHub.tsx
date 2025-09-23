import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComplianceDashboard } from './ComplianceDashboard';
import { AuditLogViewer } from './AuditLogViewer';
import { PrivacyRequestManager } from './PrivacyRequestManager';

export const MonitoringComplianceHub: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Monitoring & Compliance</h1>
        <p className="text-muted-foreground">
          Comprehensive data governance, audit trails, and privacy compliance management
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Compliance Dashboard</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="privacy">Privacy Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <ComplianceDashboard />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <AuditLogViewer />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <PrivacyRequestManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};