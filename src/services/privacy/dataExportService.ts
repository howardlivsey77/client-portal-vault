import { supabase } from '@/integrations/supabase/client';
import { logger } from '../loggingService';
import { AuditLoggingService } from '../audit/auditLoggingService';

export type ExportFormat = 'json' | 'csv' | 'pdf';
export type ExportScope = 'personal_data' | 'employment_data' | 'payroll_data' | 'complete_profile';

export interface DataExportRequest {
  id: string;
  employee_id: string;
  requester_id: string;
  request_date: Date;
  completion_date?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  export_format: ExportFormat;
  export_scope: ExportScope;
  include_historical: boolean;
  file_path?: string;
  file_size?: number;
  download_count: number;
  expires_at: Date;
  error_message?: string;
}

export interface PersonalDataPackage {
  employee_info: any;
  employment_history: any[];
  payroll_data: any[];
  timesheet_data: any[];
  sickness_records: any[];
  work_patterns: any[];
  documents: any[];
  audit_trail: any[];
  export_metadata: {
    request_id: string;
    export_date: string;
    format: ExportFormat;
    scope: ExportScope;
    total_records: number;
    data_sources: string[];
  };
}

export class DataExportService {
  /**
   * Create a new data export request
   */
  static async createExportRequest(params: {
    employeeId: string;
    requesterId: string;
    exportFormat: ExportFormat;
    exportScope: ExportScope;
    includeHistorical?: boolean;
    expiryDays?: number;
  }): Promise<DataExportRequest> {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (params.expiryDays || 30));

      // Using the existing data_access_audit_log table as a proxy until types are regenerated
      const userId = (await supabase.auth.getUser()).data.user?.id || '';
      
      // Log the export request in audit log
      const { data: auditData, error } = await supabase
        .from('data_access_audit_log')
        .insert({
          user_id: userId,
          accessed_table: 'data_export_requests',
          accessed_record_id: null,
          access_type: 'privacy_request',
          sensitive_fields: [params.exportScope],
          user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Return a mock export request object
      const data: DataExportRequest = {
        id: auditData.id,
        employee_id: params.employeeId,
        requester_id: params.requesterId,
        request_date: new Date(),
        status: 'pending',
        export_format: params.exportFormat,
        export_scope: params.exportScope,
        include_historical: params.includeHistorical || false,
        download_count: 0,
        expires_at: expiryDate,
      };

      if (error) throw error;

      await AuditLoggingService.logSensitiveDataAccess({
        eventType: 'privacy_request',
        tableName: 'data_export_requests',
        recordId: data.id,
        additionalContext: {
          request_type: 'data_export',
          employee_id: params.employeeId,
          format: params.exportFormat,
          scope: params.exportScope,
        },
      });

      logger.info(`Data export request created`, { 
        requestId: data.id, 
        employeeId: params.employeeId,
        format: params.exportFormat,
        scope: params.exportScope
      }, 'DataExportService');

      return data;
    } catch (error) {
      logger.error('Failed to create export request', error, 'DataExportService');
      throw error;
    }
  }

  /**
   * Collect all personal data for an employee
   */
  static async collectPersonalData(employeeId: string, scope: ExportScope, includeHistorical: boolean): Promise<PersonalDataPackage> {
    try {
      const dataPackage: PersonalDataPackage = {
        employee_info: {},
        employment_history: [],
        payroll_data: [],
        timesheet_data: [],
        sickness_records: [],
        work_patterns: [],
        documents: [],
        audit_trail: [],
        export_metadata: {
          request_id: '',
          export_date: new Date().toISOString(),
          format: 'json',
          scope,
          total_records: 0,
          data_sources: [],
        },
      };

      // Employee basic information
      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (employee) {
        dataPackage.employee_info = {
          id: employee.id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          hire_date: employee.hire_date,
          leave_date: employee.leave_date,
          department: employee.department,
          status: employee.status,
          hours_per_week: employee.hours_per_week,
          created_at: employee.created_at,
          updated_at: employee.updated_at,
        };

        // Include sensitive data only if scope allows
        if (scope === 'complete_profile') {
          dataPackage.employee_info = {
            ...dataPackage.employee_info,
            date_of_birth: employee.date_of_birth,
            national_insurance_number: employee.national_insurance_number,
            tax_code: employee.tax_code,
            nic_code: employee.nic_code,
            address1: employee.address1,
            address2: employee.address2,
            address3: employee.address3,
            address4: employee.address4,
            postcode: employee.postcode,
            payroll_id: employee.payroll_id,
            hourly_rate: employee.hourly_rate,
          };
        }
        dataPackage.export_metadata.data_sources.push('employees');
      }

      // Payroll data (if scope includes payroll)
      if (scope === 'payroll_data' || scope === 'complete_profile') {
        const payrollQuery = supabase
          .from('payroll_results')
          .select('*')
          .eq('employee_id', employeeId);

        if (!includeHistorical) {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          payrollQuery.gte('created_at', oneYearAgo.toISOString());
        }

        const { data: payrollData } = await payrollQuery;
        if (payrollData && payrollData.length > 0) {
          dataPackage.payroll_data = payrollData;
          dataPackage.export_metadata.data_sources.push('payroll_results');
        }
      }

      // Employment-related data
      if (scope === 'employment_data' || scope === 'complete_profile') {
        // Timesheet entries
        const timesheetQuery = supabase
          .from('timesheet_entries')
          .select('*')
          .eq('employee_id', employeeId);

        if (!includeHistorical) {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          timesheetQuery.gte('date', oneYearAgo.toISOString());
        }

        const { data: timesheetData } = await timesheetQuery;
        if (timesheetData && timesheetData.length > 0) {
          dataPackage.timesheet_data = timesheetData;
          dataPackage.export_metadata.data_sources.push('timesheet_entries');
        }

        // Sickness records
        const { data: sicknessData } = await supabase
          .from('employee_sickness_records')
          .select('*')
          .eq('employee_id', employeeId);

        if (sicknessData && sicknessData.length > 0) {
          dataPackage.sickness_records = sicknessData;
          dataPackage.export_metadata.data_sources.push('employee_sickness_records');
        }

        // Work patterns
        const { data: workPatterns } = await supabase
          .from('work_patterns')
          .select('*')
          .eq('employee_id', employeeId);

        if (workPatterns && workPatterns.length > 0) {
          dataPackage.work_patterns = workPatterns;
          dataPackage.export_metadata.data_sources.push('work_patterns');
        }
      }

      // Personal data scope includes basic contact and profile info
      if (scope === 'personal_data' || scope === 'complete_profile') {
        // Get documents associated with the employee
        const { data: documents } = await supabase
          .from('documents')
          .select('id, title, file_name, mime_type, file_size, created_at')
          .eq('company_id', employee?.company_id);

        if (documents && documents.length > 0) {
          dataPackage.documents = documents;
          dataPackage.export_metadata.data_sources.push('documents');
        }
      }

      // Include audit trail for transparency
      const { data: auditData } = await supabase
        .from('data_access_audit_log')
        .select('accessed_table, access_type, created_at')
        .eq('user_id', employee?.user_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (auditData && auditData.length > 0) {
        dataPackage.audit_trail = auditData;
        dataPackage.export_metadata.data_sources.push('data_access_audit_log');
      }

      // Calculate total records
      dataPackage.export_metadata.total_records = 
        (dataPackage.employee_info ? 1 : 0) +
        dataPackage.payroll_data.length +
        dataPackage.timesheet_data.length +
        dataPackage.sickness_records.length +
        dataPackage.work_patterns.length +
        dataPackage.documents.length +
        dataPackage.audit_trail.length;

      logger.info(`Personal data collected for export`, {
        employeeId,
        scope,
        totalRecords: dataPackage.export_metadata.total_records,
        dataSources: dataPackage.export_metadata.data_sources
      }, 'DataExportService');

      return dataPackage;
    } catch (error) {
      logger.error('Failed to collect personal data', error, 'DataExportService');
      throw error;
    }
  }

  /**
   * Process a data export request
   */
  static async processExportRequest(requestId: string): Promise<void> {
    try {
      // For now, create a mock request since we're using audit log as proxy
      const request: DataExportRequest = {
        id: requestId,
        employee_id: 'mock-employee-id',
        requester_id: 'mock-requester-id',
        request_date: new Date(),
        status: 'processing',
        export_format: 'json',
        export_scope: 'personal_data',
        include_historical: false,
        download_count: 0,
        expires_at: new Date(),
      };

      // Collect the data
      const dataPackage = await this.collectPersonalData(
        request.employee_id,
        request.export_scope,
        request.include_historical
      );

      dataPackage.export_metadata.request_id = requestId;
      dataPackage.export_metadata.format = request.export_format;

      // Generate the export file
      const { filePath, fileSize } = await this.generateExportFile(
        dataPackage,
        request.export_format,
        requestId
      );

      // Log completion in audit log
      await supabase
        .from('data_access_audit_log')
        .update({
          sensitive_fields: [`export_completed:${filePath}:${fileSize}`]
        })
        .eq('id', requestId);

      await AuditLoggingService.logDataExport({
        exportType: request.export_format,
        dataTypes: [request.export_scope as any],
        recordCount: dataPackage.export_metadata.total_records,
        fileName: filePath,
      });

      logger.info(`Export request processed successfully`, {
        requestId,
        employeeId: request.employee_id,
        filePath,
        fileSize,
        recordCount: dataPackage.export_metadata.total_records
      }, 'DataExportService');

    } catch (error) {
      // Log failure in audit log
      await supabase
        .from('data_access_audit_log')
        .update({
          sensitive_fields: [`export_failed:${error instanceof Error ? error.message : 'Unknown error'}`]
        })
        .eq('id', requestId);

      logger.error('Failed to process export request', error, 'DataExportService');
      throw error;
    }
  }

  /**
   * Generate export file in the requested format
   */
  private static async generateExportFile(
    dataPackage: PersonalDataPackage,
    format: ExportFormat,
    requestId: string
  ): Promise<{ filePath: string; fileSize: number }> {
    const fileName = `data-export-${requestId}-${Date.now()}.${format}`;
    let content: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(dataPackage, null, 2);
        mimeType = 'application/json';
        break;

      case 'csv':
        content = this.convertToCSV(dataPackage);
        mimeType = 'text/csv';
        break;


      case 'pdf':
        // For PDF, we would use a library like jsPDF or similar
        content = JSON.stringify(dataPackage, null, 2); // Fallback to JSON for now
        mimeType = 'application/pdf';
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    // Store the file (in a real implementation, this would go to secure storage)
    const blob = new Blob([content], { type: mimeType });
    const fileSize = blob.size;

    // For now, we'll just return the path - in production this would upload to storage
    const filePath = `exports/${fileName}`;

    return { filePath, fileSize };
  }

  /**
   * Convert data package to CSV format
   */
  private static convertToCSV(dataPackage: PersonalDataPackage): string {
    const csvSections: string[] = [];

    // Employee info
    if (dataPackage.employee_info) {
      csvSections.push('EMPLOYEE INFORMATION');
      csvSections.push(this.objectToCSV([dataPackage.employee_info]));
      csvSections.push('');
    }

    // Payroll data
    if (dataPackage.payroll_data.length > 0) {
      csvSections.push('PAYROLL DATA');
      csvSections.push(this.objectToCSV(dataPackage.payroll_data));
      csvSections.push('');
    }

    // Timesheet data
    if (dataPackage.timesheet_data.length > 0) {
      csvSections.push('TIMESHEET DATA');
      csvSections.push(this.objectToCSV(dataPackage.timesheet_data));
      csvSections.push('');
    }

    return csvSections.join('\n');
  }

  /**
   * Convert object array to CSV string
   */
  private static objectToCSV(objects: any[]): string {
    if (objects.length === 0) return '';

    const headers = Object.keys(objects[0]);
    const csvRows = [headers.join(',')];

    objects.forEach(obj => {
      const values = headers.map(header => {
        const value = obj[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Convert data package to XML format
   */
  private static convertToXML(dataPackage: PersonalDataPackage): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<personal_data_export>\n';

    // Convert each section to XML
    Object.entries(dataPackage).forEach(([key, value]) => {
      xml += `  <${key}>\n`;
      if (Array.isArray(value)) {
        value.forEach(item => {
          xml += '    <item>\n';
          Object.entries(item).forEach(([itemKey, itemValue]) => {
            xml += `      <${itemKey}>${this.escapeXML(String(itemValue))}</${itemKey}>\n`;
          });
          xml += '    </item>\n';
        });
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([objKey, objValue]) => {
          xml += `    <${objKey}>${this.escapeXML(String(objValue))}</${objKey}>\n`;
        });
      }
      xml += `  </${key}>\n`;
    });

    xml += '</personal_data_export>';
    return xml;
  }

  /**
   * Escape XML special characters
   */
  private static escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Get export requests with filtering
   */
  static async getExportRequests(params: {
    employeeId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    requests: DataExportRequest[];
    total: number;
  }> {
    try {
      let query = supabase
        .from('data_export_requests')
        .select('*', { count: 'exact' });

      if (params.employeeId) {
        query = query.eq('employee_id', params.employeeId);
      }

      if (params.status) {
        query = query.eq('status', params.status);
      }

      query = query
        .order('request_date', { ascending: false })
        .range(params.offset || 0, (params.offset || 0) + (params.limit || 50) - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform string dates to Date objects and fix types
      const transformedData = (data || []).map(item => ({
        ...item,
        request_date: new Date(item.request_date),
        completion_date: item.completion_date ? new Date(item.completion_date) : undefined,
        expires_at: new Date(item.expires_at),
        status: item.status as 'pending' | 'processing' | 'completed' | 'failed',
        export_format: item.export_format as ExportFormat,
        export_scope: item.export_scope as ExportScope,
        download_count: item.download_count || 0,
        file_size: item.file_size || undefined,
      }));

      return {
        requests: transformedData,
        total: count || 0,
      };
    } catch (error) {
      logger.error('Failed to fetch export requests', error, 'DataExportService');
      throw error;
    }
  }

  /**
   * Track download of an export file
   */
  static async trackDownload(requestId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('data_export_requests')
        .update({
          download_count: 1  // Simple increment for now
        })
        .eq('id', requestId);

      if (error) throw error;

      await AuditLoggingService.logSensitiveDataAccess({
        eventType: 'data_export',
        tableName: 'data_export_requests',
        recordId: requestId,
        additionalContext: {
          action: 'file_download',
          timestamp: new Date().toISOString(),
        },
      });

      logger.info(`Export file downloaded`, { requestId }, 'DataExportService');
    } catch (error) {
      logger.error('Failed to track download', error, 'DataExportService');
      throw error;
    }
  }

  /**
   * Clean up expired export files
   */
  static async cleanupExpiredExports(): Promise<number> {
    try {
      const { data: expiredRequests } = await supabase
        .from('data_export_requests')
        .select('id, file_path')
        .lt('expires_at', new Date().toISOString())
        .eq('status', 'completed');

      if (!expiredRequests || expiredRequests.length === 0) {
        return 0;
      }

      // Mark as expired and clear file paths
      const { error } = await supabase
        .from('data_export_requests')
        .update({
          status: 'expired',
          file_path: null,
        })
        .in('id', expiredRequests.map(r => r.id));

      if (error) throw error;

      logger.info(`Cleaned up ${expiredRequests.length} expired export files`, {
        expiredCount: expiredRequests.length
      }, 'DataExportService');

      return expiredRequests.length;
    } catch (error) {
      logger.error('Failed to cleanup expired exports', error, 'DataExportService');
      throw error;
    }
  }
}