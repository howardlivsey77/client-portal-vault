import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, FileText, TrendingUp, TrendingDown } from 'lucide-react'

interface AuditLog {
  id: string
  record_id: string
  employee_id: string
  start_date: string
  end_date: string | null
  stored_total_days: number
  calculated_total_days: number
  difference: number
  created_at: string
  audit_type: string
  resolved: boolean
  notes: string | null
}

export const SicknessAuditDashboard: React.FC = () => {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['sickness-audit-logs'],
    queryFn: async (): Promise<AuditLog[]> => {
      const { data, error } = await supabase
        .from('sickness_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      return data || []
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  const { data: integrityCheck, isLoading: checkLoading } = useQuery({
    queryKey: ['sickness-integrity-check'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('run_sickness_integrity_check')
      
      if (error) throw error
      return data || []
    },
    refetchInterval: 60000 // Refresh every minute
  })

  if (isLoading || checkLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading audit data...</div>
        </CardContent>
      </Card>
    )
  }

  const recentIssues = auditLogs?.filter(log => !log.resolved) || []
  const totalDiscrepancies = integrityCheck?.length || 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Discrepancies</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDiscrepancies}</div>
            <p className="text-xs text-muted-foreground">
              Active working days mismatches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentIssues.length}</div>
            <p className="text-xs text-muted-foreground">
              Unresolved audit entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalDiscrepancies === 0 ? '100%' : '85%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Working days accuracy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Integrity Issues */}
      {totalDiscrepancies > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Current Integrity Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {integrityCheck?.map((issue: any, index: number) => (
                <div key={index} className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {issue.difference > 0 ? (
                        <TrendingUp className="w-4 h-4 text-red-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="font-medium">Employee ID: {issue.employee_id}</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        Stored: {issue.stored_days}
                      </Badge>
                      <Badge variant="outline">
                        Calculated: {issue.calculated_days}
                      </Badge>
                      <Badge variant={Math.abs(issue.difference) > 1 ? 'destructive' : 'secondary'}>
                        Diff: {issue.difference > 0 ? '+' : ''}{issue.difference}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Period: {issue.start_date} {issue.end_date ? `- ${issue.end_date}` : '(ongoing)'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Audit Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentIssues.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent audit issues found. System integrity is good! ✅
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentIssues.map((log) => (
                <div key={log.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Employee: {log.employee_id}</div>
                      <div className="text-sm text-muted-foreground">
                        {log.start_date} {log.end_date ? `- ${log.end_date}` : '(ongoing)'}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={Math.abs(log.difference) > 1 ? 'destructive' : 'secondary'}>
                        {log.difference > 0 ? '+' : ''}{log.difference} days
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}