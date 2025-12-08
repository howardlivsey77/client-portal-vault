import { supabase } from '@/integrations/supabase/client'

export interface IntegrityCheckResult {
  employee_id: string
  record_id: string
  start_date: string
  end_date: string | null
  stored_days: number
  calculated_days: number
  difference: number
}

export interface AuditLog {
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

export class SicknessIntegrityMonitor {
  /**
   * Run a comprehensive integrity check on all sickness records
   */
  static async runIntegrityCheck(): Promise<IntegrityCheckResult[]> {
    const { data, error } = await supabase
      .rpc('run_sickness_integrity_check')
    
    if (error) {
      console.error('Failed to run integrity check:', error)
      throw error
    }
    
    return data || []
  }

  /**
   * Get recent audit logs
   */
  static async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('sickness_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Failed to fetch audit logs:', error)
      throw error
    }
    
    return data || []
  }

  /**
   * Get unresolved audit issues
   */
  static async getUnresolvedIssues(): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('sickness_audit_log')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Failed to fetch unresolved issues:', error)
      throw error
    }
    
    return data || []
  }

  /**
   * Mark an audit issue as resolved
   */
  static async resolveAuditIssue(auditLogId: string, notes?: string): Promise<void> {
    const { error } = await supabase
      .from('sickness_audit_log')
      .update({ 
        resolved: true, 
        resolved_at: new Date().toISOString(),
        notes: notes || null
      })
      .eq('id', auditLogId)
    
    if (error) {
      console.error('Failed to resolve audit issue:', error)
      throw error
    }
  }

  /**
   * Calculate data quality metrics
   */
  static async getDataQualityMetrics(): Promise<{
    totalRecords: number
    recordsWithDiscrepancies: number
    accuracyPercentage: number
    averageDiscrepancy: number
  }> {
    const [totalRecordsResult, integrityResults] = await Promise.all([
      supabase
        .from('employee_sickness_records')
        .select('id', { count: 'exact' }),
      this.runIntegrityCheck()
    ])

    const totalRecords = totalRecordsResult.count || 0
    const recordsWithDiscrepancies = integrityResults.length
    const accuracyPercentage = totalRecords > 0 
      ? ((totalRecords - recordsWithDiscrepancies) / totalRecords) * 100 
      : 100

    const averageDiscrepancy = recordsWithDiscrepancies > 0
      ? integrityResults.reduce((sum, record) => sum + Math.abs(record.difference), 0) / recordsWithDiscrepancies
      : 0

    return {
      totalRecords,
      recordsWithDiscrepancies,
      accuracyPercentage: Math.round(accuracyPercentage * 10) / 10,
      averageDiscrepancy: Math.round(averageDiscrepancy * 10) / 10
    }
  }

  /**
   * Create a manual audit log entry (for testing or manual corrections)
   */
  static async createManualAuditLog(params: {
    recordId: string
    employeeId: string
    startDate: string
    endDate?: string
    storedDays: number
    calculatedDays: number
    notes?: string
  }): Promise<void> {
    const { error } = await supabase
      .from('sickness_audit_log')
      .insert({
        record_id: params.recordId,
        employee_id: params.employeeId,
        start_date: params.startDate,
        end_date: params.endDate || null,
        stored_total_days: params.storedDays,
        calculated_total_days: params.calculatedDays,
        difference: params.storedDays - params.calculatedDays,
        audit_type: 'manual_entry',
        notes: params.notes || null
      })

    if (error) {
      console.error('Failed to create manual audit log:', error)
      throw error
    }
  }

  /**
   * Get integrity metrics for dashboard
   */
  static async getDashboardMetrics(): Promise<{
    totalDiscrepancies: number
    unresolvedIssues: number
    dataQuality: number
    recentIssuesCount: number
  }> {
    const [integrityResults, unresolvedIssues, auditLogs] = await Promise.all([
      this.runIntegrityCheck(),
      this.getUnresolvedIssues(),
      this.getAuditLogs(10) // Recent 10 entries
    ])

    const recentIssuesCount = auditLogs.filter(log => {
      const logDate = new Date(log.created_at)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return logDate > oneDayAgo && !log.resolved
    }).length

    const dataQualityMetrics = await this.getDataQualityMetrics()

    return {
      totalDiscrepancies: integrityResults.length,
      unresolvedIssues: unresolvedIssues.length,
      dataQuality: dataQualityMetrics.accuracyPercentage,
      recentIssuesCount
    }
  }
}