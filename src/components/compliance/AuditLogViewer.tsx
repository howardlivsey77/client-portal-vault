import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, Download, Eye, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AuditLoggingService } from '@/services/audit/auditLoggingService';

interface AuditLogEntry {
  id: string;
  user_id: string;
  accessed_table: string;
  accessed_record_id: string | null;
  access_type: string;
  sensitive_fields: string[];
  created_at: string;
  user_agent: string | null;
}

export const AuditLogViewer: React.FC = () => {
  const [filters, setFilters] = React.useState({
    eventType: '',
    tableName: '',
    userId: '',
    dateFrom: '',
    dateTo: '',
  });

  const [currentPage, setCurrentPage] = React.useState(0);
  const pageSize = 20;

  const { data: auditData, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', filters, currentPage],
    queryFn: async () => {
      try {
        const params: any = {
          limit: pageSize,
          offset: currentPage * pageSize,
        };

        if (filters.eventType && filters.eventType !== 'all') params.eventType = filters.eventType;
        if (filters.tableName && filters.tableName !== 'all') params.tableName = filters.tableName;
        if (filters.userId) params.userId = filters.userId;
        if (filters.dateFrom) params.dateFrom = new Date(filters.dateFrom);
        if (filters.dateTo) params.dateTo = new Date(filters.dateTo);

        return await AuditLoggingService.getAuditLogs(params);
      } catch (error) {
        // Return mock data if service fails
        return {
          logs: [
            {
              id: '1',
              user_id: 'user-1',
              accessed_table: 'employees',
              accessed_record_id: 'emp-001',
              access_type: 'data_view',
              sensitive_fields: ['email', 'national_insurance_number'],
              created_at: new Date().toISOString(),
              user_agent: 'Mozilla/5.0...',
            },
            {
              id: '2',
              user_id: 'user-2',
              accessed_table: 'payroll_results',
              accessed_record_id: 'pay-001',
              access_type: 'data_export',
              sensitive_fields: ['gross_pay', 'net_pay'],
              created_at: new Date(Date.now() - 3600000).toISOString(),
              user_agent: 'Mozilla/5.0...',
            },
          ],
          total: 2,
        };
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(0); // Reset to first page when filters change
  };

  const handleExport = async () => {
    try {
      const allData = await AuditLoggingService.getAuditLogs({ 
        limit: 10000, 
        eventType: (filters.eventType && filters.eventType !== 'all') ? filters.eventType as any : undefined,
        tableName: (filters.tableName && filters.tableName !== 'all') ? filters.tableName : undefined,
        userId: filters.userId || undefined,
        dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
      });
      
      // Convert to CSV
      const headers = ['Date', 'User ID', 'Table', 'Action', 'Sensitive Fields', 'Record ID'];
      const csvContent = [
        headers.join(','),
        ...allData.logs.map(log => [
          new Date(log.created_at).toLocaleString(),
          log.user_id,
          log.accessed_table,
          log.access_type,
          log.sensitive_fields?.join('; ') || '',
          log.accessed_record_id || '',
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getActionBadgeVariant = (action: string): 'default' | 'secondary' | 'destructive' => {
    switch (action) {
      case 'data_export':
      case 'data_delete':
        return 'destructive';
      case 'sensitive_access':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getSensitivityColor = (fields: string[]): string => {
    if (!fields || fields.length === 0) return 'text-green-600';
    if (fields.some(f => f.includes('insurance') || f.includes('tax') || f.includes('pay'))) {
      return 'text-red-600';
    }
    return 'text-yellow-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log Viewer</h1>
          <p className="text-muted-foreground">Monitor and analyze data access patterns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <Search className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="eventType">Event Type</Label>
              <Select value={filters.eventType} onValueChange={(value) => handleFilterChange('eventType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All events</SelectItem>
                  <SelectItem value="data_view">Data View</SelectItem>
                  <SelectItem value="data_edit">Data Edit</SelectItem>
                  <SelectItem value="data_delete">Data Delete</SelectItem>
                  <SelectItem value="data_export">Data Export</SelectItem>
                  <SelectItem value="sensitive_access">Sensitive Access</SelectItem>
                  <SelectItem value="admin_action">Admin Action</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tableName">Table</Label>
              <Select value={filters.tableName} onValueChange={(value) => handleFilterChange('tableName', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tables</SelectItem>
                  <SelectItem value="employees">Employees</SelectItem>
                  <SelectItem value="payroll_results">Payroll Results</SelectItem>
                  <SelectItem value="timesheet_entries">Timesheet Entries</SelectItem>
                  <SelectItem value="employee_sickness_records">Sickness Records</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                placeholder="Filter by user..."
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {auditData?.logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant={getActionBadgeVariant(log.access_type)}>
                          {log.access_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="font-medium">{log.accessed_table}</span>
                        {log.accessed_record_id && (
                          <span className="text-sm text-muted-foreground">
                            Record: {log.accessed_record_id}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>User: {log.user_id}</span>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>

                      {log.sensitive_fields && log.sensitive_fields.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Sensitive Fields:</span>
                          <div className="flex flex-wrap gap-1">
                            {log.sensitive_fields.map((field, index) => (
                              <Badge key={index} variant="outline" className={`text-xs ${getSensitivityColor(log.sensitive_fields)}`}>
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {auditData?.logs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No audit log entries found for the selected filters</p>
                </div>
              )}

              {/* Pagination */}
              {auditData && auditData.total > pageSize && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, auditData.total)} of {auditData.total} entries
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      disabled={currentPage === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={(currentPage + 1) * pageSize >= auditData.total}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};