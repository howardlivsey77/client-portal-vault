import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/services/common/loggingService';

export type AuditEventType = 
  | 'data_view' 
  | 'data_edit' 
  | 'data_delete' 
  | 'data_export'
  | 'sensitive_access'
  | 'auth_event'
  | 'admin_action'
  | 'privacy_request'
  | string; // Allow any string for flexibility

export type SensitiveDataType = 
  | 'employee_personal'
  | 'payroll_data'
  | 'medical_records'
  | 'financial_info'
  | 'contact_details';

export interface AuditLogEntry {
  user_id: string;
  event_type: AuditEventType;
  table_name: string;
  record_id?: string;
  sensitive_fields?: string[];
  data_type?: SensitiveDataType;
  ip_address?: string;
  user_agent?: string;
  additional_context?: Record<string, any>;
}

export interface DataAccessPattern {
  user_id: string;
  access_count: number;
  last_access: Date;
  unique_tables: number;
  sensitive_access_count: number;
  bulk_access_detected: boolean;
  off_hours_access: boolean;
  geographic_anomaly: boolean;
}

export class AuditLoggingService {
  /**
   * Log sensitive data access with comprehensive details
   */
  static async logSensitiveDataAccess(params: {
    eventType: AuditEventType;
    tableName: string;
    recordId?: string;
    sensitiveFields?: string[];
    dataType?: SensitiveDataType;
    additionalContext?: Record<string, any>;
  }): Promise<void> {
    try {
      const entry: AuditLogEntry = {
        user_id: (await supabase.auth.getUser()).data.user?.id || '',
        event_type: params.eventType,
        table_name: params.tableName,
        record_id: params.recordId,
        sensitive_fields: params.sensitiveFields,
        data_type: params.dataType,
        additional_context: params.additionalContext,
      };

      // Get client IP and user agent if available
      if (typeof window !== 'undefined') {
        entry.user_agent = navigator.userAgent;
      }

      const { error } = await supabase
        .from('data_access_audit_log')
        .insert({
          user_id: entry.user_id,
          accessed_table: entry.table_name,
          accessed_record_id: entry.record_id,
          access_type: entry.event_type,
          sensitive_fields: entry.sensitive_fields || [],
          user_agent: entry.user_agent,
        });

      if (error) {
        logger.error('Failed to log audit event', error, 'AuditLoggingService');
        throw error;
      }

      logger.debug(`Audit logged: ${entry.event_type} on ${entry.table_name}`, entry, 'AuditLoggingService');
    } catch (error) {
      logger.error('Failed to create audit log entry', error, 'AuditLoggingService');
      throw error;
    }
  }

  /**
   * Log data export events with detailed metadata
   */
  static async logDataExport(params: {
    exportType: 'excel' | 'csv' | 'pdf' | 'json';
    dataTypes: SensitiveDataType[];
    recordCount: number;
    filters?: Record<string, any>;
    fileName?: string;
  }): Promise<void> {
    await this.logSensitiveDataAccess({
      eventType: 'data_export',
      tableName: 'bulk_export',
      additionalContext: {
        export_type: params.exportType,
        data_types: params.dataTypes,
        record_count: params.recordCount,
        filters: params.filters,
        file_name: params.fileName,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log authentication and session events
   */
  static async logAuthEvent(params: {
    eventType: 'login' | 'logout' | 'password_change' | 'session_timeout';
    success: boolean;
    additionalContext?: Record<string, any>;
  }): Promise<void> {
    await this.logSensitiveDataAccess({
      eventType: 'auth_event',
      tableName: 'auth_events',
      additionalContext: {
        auth_event_type: params.eventType,
        success: params.success,
        ...params.additionalContext,
      },
    });
  }

  /**
   * Log admin actions for governance
   */
  static async logAdminAction(params: {
    action: string;
    targetUserId?: string;
    changes?: Record<string, any>;
    reason?: string;
  }): Promise<void> {
    await this.logSensitiveDataAccess({
      eventType: 'admin_action',
      tableName: 'admin_actions',
      recordId: params.targetUserId,
      additionalContext: {
        action: params.action,
        changes: params.changes,
        reason: params.reason,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(params: {
    limit?: number;
    offset?: number;
    userId?: string;
    eventType?: AuditEventType;
    tableName?: string;
    dateFrom?: Date;
    dateTo?: Date;
  } = {}): Promise<{
    logs: any[];
    total: number;
  }> {
    let query = supabase
      .from('data_access_audit_log')
      .select('*', { count: 'exact' });

    if (params.userId) {
      query = query.eq('user_id', params.userId);
    }

    if (params.eventType) {
      query = query.eq('access_type', params.eventType);
    }

    if (params.tableName) {
      query = query.eq('accessed_table', params.tableName);
    }

    if (params.dateFrom) {
      query = query.gte('created_at', params.dateFrom.toISOString());
    }

    if (params.dateTo) {
      query = query.lte('created_at', params.dateTo.toISOString());
    }

    query = query
      .order('created_at', { ascending: false })
      .range(params.offset || 0, (params.offset || 0) + (params.limit || 50) - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch audit logs', error, 'AuditLoggingService');
      throw error;
    }

    return {
      logs: data || [],
      total: count || 0,
    };
  }

  /**
   * Analyze data access patterns for anomaly detection
   */
  static async analyzeAccessPatterns(timeWindowHours: number = 24): Promise<DataAccessPattern[]> {
    const timeThreshold = new Date();
    timeThreshold.setHours(timeThreshold.getHours() - timeWindowHours);

    const { data, error } = await supabase
      .from('data_access_audit_log')
      .select('user_id, accessed_table, access_type, created_at, sensitive_fields')
      .gte('created_at', timeThreshold.toISOString());

    if (error) {
      logger.error('Failed to analyze access patterns', error, 'AuditLoggingService');
      throw error;
    }

    // Group by user and analyze patterns
    const userPatterns = new Map<string, DataAccessPattern>();

    data?.forEach(log => {
      const userId = log.user_id;
      const accessTime = new Date(log.created_at);
      
      if (!userPatterns.has(userId)) {
        userPatterns.set(userId, {
          user_id: userId,
          access_count: 0,
          last_access: accessTime,
          unique_tables: new Set<string>().size,
          sensitive_access_count: 0,
          bulk_access_detected: false,
          off_hours_access: false,
          geographic_anomaly: false,
        });
      }

      const pattern = userPatterns.get(userId)!;
      pattern.access_count++;
      
      if (accessTime > pattern.last_access) {
        pattern.last_access = accessTime;
      }

      // Check for off-hours access (before 6 AM or after 10 PM)
      const hour = accessTime.getHours();
      if (hour < 6 || hour > 22) {
        pattern.off_hours_access = true;
      }

      // Count sensitive field access
      if (log.sensitive_fields && log.sensitive_fields.length > 0) {
        pattern.sensitive_access_count++;
      }
    });

    // Convert map to array and detect bulk access
    const patterns = Array.from(userPatterns.values()).map(pattern => {
      // Detect bulk access (more than 100 accesses in time window)
      pattern.bulk_access_detected = pattern.access_count > 100;
      
      return pattern;
    });

    return patterns;
  }

  /**
   * Get compliance summary for reporting
   */
  static async getComplianceSummary(dateFrom: Date, dateTo: Date): Promise<{
    totalDataAccess: number;
    sensitiveDataAccess: number;
    dataExports: number;
    adminActions: number;
    authEvents: number;
    privacyRequests: number;
    anomalousActivity: number;
  }> {
    const { logs } = await this.getAuditLogs({
      dateFrom,
      dateTo,
      limit: 10000, // Get all records for analysis
    });

    const summary = {
      totalDataAccess: logs.length,
      sensitiveDataAccess: logs.filter(log => 
        log.sensitive_fields && log.sensitive_fields.length > 0
      ).length,
      dataExports: logs.filter(log => log.access_type === 'data_export').length,
      adminActions: logs.filter(log => log.access_type === 'admin_action').length,
      authEvents: logs.filter(log => log.access_type === 'auth_event').length,
      privacyRequests: logs.filter(log => log.access_type === 'privacy_request').length,
      anomalousActivity: 0, // Will be calculated from pattern analysis
    };

    // Analyze patterns for anomalies
    const patterns = await this.analyzeAccessPatterns(24);
    summary.anomalousActivity = patterns.filter(p => 
      p.bulk_access_detected || p.off_hours_access || p.geographic_anomaly
    ).length;

    return summary;
  }
}