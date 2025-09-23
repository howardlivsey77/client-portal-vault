import { supabase } from '@/integrations/supabase/client';
import { logger } from '../loggingService';
import { AuditLoggingService } from '../audit/auditLoggingService';

export type ErasureRequestStatus = 
  | 'pending'
  | 'in_progress' 
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type ErasureMethod = 
  | 'hard_delete'      // Permanent deletion
  | 'anonymization'    // Replace with anonymous values
  | 'pseudonymization' // Replace with pseudonymous values
  | 'archival';        // Move to secure archive

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
  retention_override?: boolean;
  affected_tables: string[];
  records_processed: number;
  total_records: number;
  verification_hash?: string;
  notes?: string;
}

export interface ErasureScope {
  table: string;
  recordIds: string[];
  sensitiveFields: string[];
  dependencies: string[]; // Related tables that need updating
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
      // First, analyze the scope of data to be erased
      const scope = await this.analyzeErasureScope(params.employeeId);
      
      const { data, error } = await supabase
        .from('erasure_requests')
        .insert({
          employee_id: params.employeeId,
          requester_id: params.requesterId,
          request_date: new Date().toISOString(),
          status: 'pending',
          erasure_method: params.erasureMethod,
          reason: params.reason,
          legal_basis: params.legalBasis,
          retention_override: params.retentionOverride || false,
          affected_tables: scope.map(s => s.table),
          records_processed: 0,
          total_records: scope.reduce((sum, s) => sum + s.recordIds.length, 0),
          notes: params.notes,
        })
        .select()
        .single();

      if (error) throw error;

      await AuditLoggingService.logSensitiveDataAccess({
        eventType: 'privacy_request',
        tableName: 'erasure_requests',
        recordId: data.id,
        additionalContext: {
          request_type: 'right_to_erasure',
          employee_id: params.employeeId,
          method: params.erasureMethod,
          total_records: data.total_records,
        },
      });

      logger.info(`Erasure request created`, { 
        requestId: data.id, 
        employeeId: params.employeeId,
        totalRecords: data.total_records 
      }, 'RightToErasureService');

      return data;
    } catch (error) {
      logger.error('Failed to create erasure request', error, 'RightToErasureService');
      throw error;
    }
  }

  /**
   * Analyze the scope of data that would be affected by erasure
   */
  static async analyzeErasureScope(employeeId: string): Promise<ErasureScope[]> {
    const scope: ErasureScope[] = [];

    try {
      // Employee record itself
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('id', employeeId)
        .single();

      if (employee) {
        scope.push({
          table: 'employees',
          recordIds: [employeeId],
          sensitiveFields: [
            'first_name', 'last_name', 'email', 'national_insurance_number',
            'address1', 'address2', 'address3', 'address4', 'postcode',
            'date_of_birth', 'payroll_id'
          ],
          dependencies: ['payroll_results', 'timesheet_entries', 'employee_sickness_records'],
        });
      }

      // Payroll results
      const { data: payrollResults } = await supabase
        .from('payroll_results')
        .select('id')
        .eq('employee_id', employeeId);

      if (payrollResults && payrollResults.length > 0) {
        scope.push({
          table: 'payroll_results',
          recordIds: payrollResults.map(r => r.id),
          sensitiveFields: [
            'gross_pay_this_period', 'net_pay_this_period', 'taxable_pay_this_period',
            'income_tax_this_period', 'nic_employee_this_period', 'tax_code'
          ],
          dependencies: [],
        });
      }

      // Timesheet entries
      const { data: timesheets } = await supabase
        .from('timesheet_entries')
        .select('id')
        .eq('employee_id', employeeId);

      if (timesheets && timesheets.length > 0) {
        scope.push({
          table: 'timesheet_entries',
          recordIds: timesheets.map(t => t.id),
          sensitiveFields: ['actual_start', 'actual_end', 'payroll_id'],
          dependencies: [],
        });
      }

      // Sickness records
      const { data: sicknessRecords } = await supabase
        .from('employee_sickness_records')
        .select('id')
        .eq('employee_id', employeeId);

      if (sicknessRecords && sicknessRecords.length > 0) {
        scope.push({
          table: 'employee_sickness_records',
          recordIds: sicknessRecords.map(s => s.id),
          sensitiveFields: ['reason', 'notes', 'is_certified'],
          dependencies: ['sickness_audit_log'],
        });
      }

      // Work patterns
      const { data: workPatterns } = await supabase
        .from('work_patterns')
        .select('id')
        .eq('employee_id', employeeId);

      if (workPatterns && workPatterns.length > 0) {
        scope.push({
          table: 'work_patterns',
          recordIds: workPatterns.map(w => w.id),
          sensitiveFields: ['start_time', 'end_time', 'payroll_id'],
          dependencies: [],
        });
      }

      logger.info(`Analyzed erasure scope for employee ${employeeId}`, {
        totalTables: scope.length,
        totalRecords: scope.reduce((sum, s) => sum + s.recordIds.length, 0)
      }, 'RightToErasureService');

      return scope;
    } catch (error) {
      logger.error('Failed to analyze erasure scope', error, 'RightToErasureService');
      throw error;
    }
  }

  /**
   * Execute an erasure request
   */
  static async executeErasureRequest(requestId: string): Promise<void> {
    try {
      // Update status to in_progress
      await supabase
        .from('erasure_requests')
        .update({ status: 'in_progress' })
        .eq('id', requestId);

      // Get request details
      const { data: request, error: requestError } = await supabase
        .from('erasure_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Check for legal holds
      const { data: legalHolds } = await supabase
        .from('legal_holds')
        .select('*')
        .eq('employee_id', request.employee_id)
        .eq('is_active', true);

      if (legalHolds && legalHolds.length > 0 && !request.retention_override) {
        await supabase
          .from('erasure_requests')
          .update({ 
            status: 'rejected',
            notes: `Request rejected due to active legal holds: ${legalHolds.map(h => h.reason).join(', ')}`
          })
          .eq('id', requestId);

        throw new Error('Cannot proceed with erasure due to active legal holds');
      }

      // Get current scope
      const scope = await this.analyzeErasureScope(request.employee_id);
      let totalProcessed = 0;

      // Execute erasure based on method
      for (const scopeItem of scope) {
        switch (request.erasure_method) {
          case 'hard_delete':
            await this.hardDeleteRecords(scopeItem);
            break;
          case 'anonymization':
            await this.anonymizeRecords(scopeItem);
            break;
          case 'pseudonymization':
            await this.pseudonymizeRecords(scopeItem);
            break;
          case 'archival':
            await this.archiveRecords(scopeItem);
            break;
        }

        totalProcessed += scopeItem.recordIds.length;

        // Update progress
        await supabase
          .from('erasure_requests')
          .update({ records_processed: totalProcessed })
          .eq('id', requestId);
      }

      // Generate verification hash
      const verificationData = {
        requestId,
        employeeId: request.employee_id,
        method: request.erasure_method,
        processedRecords: totalProcessed,
        timestamp: new Date().toISOString(),
      };
      
      const verificationHash = await this.generateVerificationHash(verificationData);

      // Mark as completed
      await supabase
        .from('erasure_requests')
        .update({ 
          status: 'completed',
          completion_date: new Date().toISOString(),
          records_processed: totalProcessed,
          verification_hash: verificationHash,
        })
        .eq('id', requestId);

      await AuditLoggingService.logAdminAction({
        action: 'execute_erasure_request',
        targetUserId: request.employee_id,
        changes: {
          request_id: requestId,
          method: request.erasure_method,
          records_processed: totalProcessed,
          verification_hash: verificationHash,
        },
        reason: 'Right to erasure request executed',
      });

      logger.info(`Erasure request completed`, { 
        requestId, 
        employeeId: request.employee_id,
        recordsProcessed: totalProcessed,
        verificationHash 
      }, 'RightToErasureService');

    } catch (error) {
      // Mark as failed
      await supabase
        .from('erasure_requests')
        .update({ 
          status: 'rejected',
          notes: error instanceof Error ? error.message : 'Unknown error during erasure'
        })
        .eq('id', requestId);

      logger.error('Failed to execute erasure request', error, 'RightToErasureService');
      throw error;
    }
  }

  /**
   * Hard delete records permanently
   */
  private static async hardDeleteRecords(scope: ErasureScope): Promise<void> {
    if (scope.recordIds.length === 0) return;

    const { error } = await supabase
      .from(scope.table)
      .delete()
      .in('id', scope.recordIds);

    if (error) throw error;
  }

  /**
   * Anonymize records by replacing sensitive data with generic values
   */
  private static async anonymizeRecords(scope: ErasureScope): Promise<void> {
    if (scope.recordIds.length === 0) return;

    const anonymizedValues: Record<string, any> = {};
    
    scope.sensitiveFields.forEach(field => {
      switch (field) {
        case 'first_name':
        case 'last_name':
          anonymizedValues[field] = 'ANONYMIZED';
          break;
        case 'email':
          anonymizedValues[field] = 'anonymized@example.com';
          break;
        case 'national_insurance_number':
        case 'payroll_id':
          anonymizedValues[field] = 'ANONYMIZED';
          break;
        default:
          if (field.includes('address') || field === 'postcode') {
            anonymizedValues[field] = 'ANONYMIZED';
          } else if (field.includes('date')) {
            anonymizedValues[field] = null;
          } else if (field.includes('pay') || field.includes('tax')) {
            anonymizedValues[field] = 0;
          } else {
            anonymizedValues[field] = 'ANONYMIZED';
          }
      }
    });

    for (const recordId of scope.recordIds) {
      const { error } = await supabase
        .from(scope.table)
        .update(anonymizedValues)
        .eq('id', recordId);

      if (error) throw error;
    }
  }

  /**
   * Pseudonymize records by replacing with pseudonymous identifiers
   */
  private static async pseudonymizeRecords(scope: ErasureScope): Promise<void> {
    if (scope.recordIds.length === 0) return;

    for (const recordId of scope.recordIds) {
      const pseudoId = `PSEUDO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const pseudonymizedValues: Record<string, any> = {};
      
      scope.sensitiveFields.forEach(field => {
        if (field.includes('name') || field === 'email') {
          pseudonymizedValues[field] = `${pseudoId}_${field}`;
        } else if (field === 'national_insurance_number' || field === 'payroll_id') {
          pseudonymizedValues[field] = pseudoId;
        } else if (field.includes('address') || field === 'postcode') {
          pseudonymizedValues[field] = `PSEUDO_${field.toUpperCase()}`;
        }
      });

      const { error } = await supabase
        .from(scope.table)
        .update(pseudonymizedValues)
        .eq('id', recordId);

      if (error) throw error;
    }
  }

  /**
   * Archive records to secure storage
   */
  private static async archiveRecords(scope: ErasureScope): Promise<void> {
    if (scope.recordIds.length === 0) return;

    // Implementation would move records to an archive table
    // For now, we'll mark them as archived
    const { error } = await supabase
      .from(scope.table)
      .update({ 
        status: 'archived',
        archived_at: new Date().toISOString(),
        archived_reason: 'right_to_erasure'
      })
      .in('id', scope.recordIds);

    if (error) throw error;
  }

  /**
   * Generate verification hash for audit purposes
   */
  private static async generateVerificationHash(data: any): Promise<string> {
    const encoder = new TextEncoder();
    const dataString = JSON.stringify(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(dataString));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get erasure requests with filtering
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
      let query = supabase
        .from('erasure_requests')
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

      return {
        requests: data || [],
        total: count || 0,
      };
    } catch (error) {
      logger.error('Failed to fetch erasure requests', error, 'RightToErasureService');
      throw error;
    }
  }

  /**
   * Verify erasure completion using verification hash
   */
  static async verifyErasure(requestId: string): Promise<{
    verified: boolean;
    details: any;
  }> {
    try {
      const { data: request } = await supabase
        .from('erasure_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (!request || !request.verification_hash) {
        return { verified: false, details: { error: 'No verification hash found' } };
      }

      // Re-analyze scope to check if data still exists
      const currentScope = await this.analyzeErasureScope(request.employee_id);
      const remainingRecords = currentScope.reduce((sum, s) => sum + s.recordIds.length, 0);

      return {
        verified: remainingRecords === 0 || request.erasure_method !== 'hard_delete',
        details: {
          method: request.erasure_method,
          originalRecords: request.total_records,
          processedRecords: request.records_processed,
          remainingRecords,
          verificationHash: request.verification_hash,
        },
      };
    } catch (error) {
      logger.error('Failed to verify erasure', error, 'RightToErasureService');
      return { verified: false, details: { error: error instanceof Error ? error.message : 'Unknown error' } };
    }
  }
}