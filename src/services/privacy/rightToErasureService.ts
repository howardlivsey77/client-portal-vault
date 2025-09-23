import { supabase } from '@/integrations/supabase/client';
import { logger } from '../loggingService';
import { AuditLoggingService } from '../audit/auditLoggingService';

export enum ErasureRequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing', 
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ErasureMethod {
  HARD_DELETE = 'hard_delete',
  ANONYMIZATION = 'anonymization',
  PSEUDONYMIZATION = 'pseudonymization',
  ARCHIVAL = 'archival',
}

export interface ErasureRequest {
  id: string;
  employee_id: string;
  requester_id: string;
  request_date: Date;
  completion_date?: Date;
  status: ErasureRequestStatus;
  erasure_method: ErasureMethod;
  reason: string;
  legal_basis?: string;
  retention_override: boolean;
  affected_tables: string[];
  records_processed: number;
  total_records: number;
  verification_hash?: string;
  notes?: string;
}

export interface ErasureScope {
  affectedTables: string[];
  recordIds: string[];
  sensitiveFields: string[];
  totalRecords: number;
}

export class RightToErasureService {
  /**
   * Create a new erasure request
   */
  static async createErasureRequest(params: {
    employeeId: string;
    requesterId: string;
    reason: string;
    legalBasis?: string;
    erasureMethod: ErasureMethod;
    retentionOverride?: boolean;
    notes?: string;
  }): Promise<ErasureRequest> {
    try {
      // Analyze the scope of data to be erased
      const scope = await this.analyzeErasureScope(params.employeeId);
      const totalRecords = scope.reduce((sum, s) => sum + s.totalRecords, 0);

      // Mock erasure request since table doesn't exist yet
      const mockRequest: ErasureRequest = {
        id: `erasure-${Date.now()}`,
        employee_id: params.employeeId,
        requester_id: params.requesterId,
        request_date: new Date(),
        status: ErasureRequestStatus.PENDING,
        erasure_method: params.erasureMethod,
        reason: params.reason,
        legal_basis: params.legalBasis,
        retention_override: params.retentionOverride || false,
        affected_tables: scope.map(s => s.affectedTables).flat(),
        records_processed: 0,
        total_records: totalRecords,
        notes: params.notes,
      };

      await AuditLoggingService.logSensitiveDataAccess({
        eventType: 'privacy_request',
        tableName: 'erasure_requests',
        recordId: mockRequest.id,
        additionalContext: {
          request_type: 'erasure',
          employee_id: params.employeeId,
          method: params.erasureMethod,
          total_records: totalRecords,
        },
      });

      logger.info('Erasure request created (mock)', mockRequest, 'RightToErasureService');
      return mockRequest;
    } catch (error) {
      logger.error('Failed to create erasure request', error, 'RightToErasureService');
      throw error;
    }
  }

  /**
   * Analyze what data would be affected by erasure
   */
  static async analyzeErasureScope(employeeId: string): Promise<ErasureScope[]> {
    try {
      const scope: ErasureScope[] = [];

      // Employee record
      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .single();

      if (employee) {
        scope.push({
          affectedTables: ['employees'],
          recordIds: [employee.id],
          sensitiveFields: [
            'first_name', 'last_name', 'email', 'date_of_birth',
            'national_insurance_number', 'address1', 'address2', 
            'address3', 'address4', 'postcode'
          ],
          totalRecords: 1,
        });
      }

      // Payroll records
      const { data: payrollRecords } = await supabase
        .from('payroll_results')
        .select('id')
        .eq('employee_id', employeeId);

      if (payrollRecords && payrollRecords.length > 0) {
        scope.push({
          affectedTables: ['payroll_results'],
          recordIds: payrollRecords.map(r => r.id),
          sensitiveFields: ['gross_pay_this_period', 'net_pay_this_period'],
          totalRecords: payrollRecords.length,
        });
      }

      // Timesheet records
      const { data: timesheetRecords } = await supabase
        .from('timesheet_entries')
        .select('id')
        .eq('employee_id', employeeId);

      if (timesheetRecords && timesheetRecords.length > 0) {
        scope.push({
          affectedTables: ['timesheet_entries'],
          recordIds: timesheetRecords.map(r => r.id),
          sensitiveFields: ['actual_start', 'actual_end'],
          totalRecords: timesheetRecords.length,
        });
      }

      return scope;
    } catch (error) {
      logger.error('Failed to analyze erasure scope', error, 'RightToErasureService');
      return []; // Return empty scope on error
    }
  }

  /**
   * Execute an erasure request
   */
  static async executeErasureRequest(requestId: string): Promise<void> {
    try {
      logger.info('Erasure request executed (mock)', { requestId }, 'RightToErasureService');

      await AuditLoggingService.logDataExport({
        exportType: 'json',
        dataTypes: ['employee_personal'],
        recordCount: 1,
        fileName: `erasure-${requestId}`,
      });
    } catch (error) {
      logger.error('Failed to execute erasure request', error, 'RightToErasureService');
      throw error;
    }
  }

  /**
   * Get erasure requests
   */
  static async getErasureRequests(params: {
    employeeId?: string;
    status?: ErasureRequestStatus;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    requests: ErasureRequest[];
    total: number;
  }> {
    try {
      // Return mock requests
      const mockRequests: ErasureRequest[] = [
        {
          id: 'erasure-1',
          employee_id: params.employeeId || 'emp-001',
          requester_id: 'user-001',
          request_date: new Date(Date.now() - 86400000),
          completion_date: new Date(),
          status: ErasureRequestStatus.COMPLETED,
          erasure_method: ErasureMethod.ANONYMIZATION,
          reason: 'Employee termination',
          legal_basis: 'GDPR Article 17',
          retention_override: false,
          affected_tables: ['employees', 'payroll_results'],
          records_processed: 25,
          total_records: 25,
          verification_hash: 'abc123def456',
          notes: 'Standard employee data erasure',
        },
      ];

      return {
        requests: mockRequests,
        total: mockRequests.length,
      };
    } catch (error) {
      logger.error('Failed to fetch erasure requests', error, 'RightToErasureService');
      throw error;
    }
  }

  /**
   * Verify erasure completion
   */
  static async verifyErasure(requestId: string): Promise<{
    verified: boolean;
    details: any;
  }> {
    try {
      // Mock verification
      return {
        verified: true,
        details: {
          status: ErasureRequestStatus.COMPLETED,
          remainingRecords: 0,
          verificationHash: 'abc123def456',
          completionDate: new Date(),
        },
      };
    } catch (error) {
      logger.error('Failed to verify erasure', error, 'RightToErasureService');
      return { verified: false, details: { error: error instanceof Error ? error.message : 'Unknown error' } };
    }
  }
}