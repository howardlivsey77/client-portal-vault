import { supabase } from '@/integrations/supabase/client';
import { logger } from '../loggingService';
import { AuditLoggingService } from '../audit/auditLoggingService';

export type RetentionPolicyType = 
  | 'employee_records'
  | 'payroll_data'
  | 'timesheet_data'
  | 'sickness_records'
  | 'audit_logs'
  | 'document_records';

export interface RetentionPolicy {
  id: string;
  policy_type: RetentionPolicyType;
  retention_period_months: number;
  auto_delete: boolean;
  legal_hold_override: boolean;
  company_id?: string;
  created_at: string;
  updated_at: string;
  description?: string;
}

export interface RetentionJob {
  id: string;
  policy_id: string;
  scheduled_date: Date;
  execution_date?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  records_identified: number;
  records_processed: number;
  error_message?: string;
}

export class DataRetentionService {
  /**
   * Create a new data retention policy
   */
  static async createRetentionPolicy(policy: Omit<RetentionPolicy, 'id' | 'created_at' | 'updated_at'>): Promise<RetentionPolicy> {
    try {
      const { data, error } = await supabase
        .from('data_retention_policies')
        .insert({
          policy_type: policy.policy_type,
          retention_period_months: policy.retention_period_months,
          auto_delete: policy.auto_delete,
          legal_hold_override: policy.legal_hold_override,
          company_id: policy.company_id,
          description: policy.description,
        })
        .select()
        .single();

      if (error) throw error;

      await AuditLoggingService.logAdminAction({
        action: 'create_retention_policy',
        changes: { policy_type: policy.policy_type, retention_period: policy.retention_period_months },
        reason: 'Data retention policy created',
      });

      logger.info(`Retention policy created: ${policy.policy_type}`, { policyId: data.id }, 'DataRetentionService');
      return data;
    } catch (error) {
      logger.error('Failed to create retention policy', error, 'DataRetentionService');
      throw error;
    }
  }

  /**
   * Get all retention policies for a company
   */
  static async getRetentionPolicies(companyId?: string): Promise<RetentionPolicy[]> {
    try {
      let query = supabase
        .from('data_retention_policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Failed to fetch retention policies', error, 'DataRetentionService');
      throw error;
    }
  }

  /**
   * Identify records eligible for deletion based on retention policies
   */
  static async identifyExpiredRecords(policyType: RetentionPolicyType, retentionMonths: number): Promise<{
    table: string;
    recordIds: string[];
    totalCount: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - retentionMonths);

    let query;
    let tableName = '';

    switch (policyType) {
      case 'employee_records':
        tableName = 'employees';
        query = supabase
          .from('employees')
          .select('id')
          .eq('status', 'inactive')
          .lt('leave_date', cutoffDate.toISOString());
        break;

      case 'payroll_data':
        tableName = 'payroll_results';
        query = supabase
          .from('payroll_results')
          .select('id')
          .lt('created_at', cutoffDate.toISOString());
        break;

      case 'timesheet_data':
        tableName = 'timesheet_entries';
        query = supabase
          .from('timesheet_entries')
          .select('id')
          .lt('date', cutoffDate.toISOString());
        break;

      case 'sickness_records':
        tableName = 'employee_sickness_records';
        query = supabase
          .from('employee_sickness_records')
          .select('id')
          .lt('created_at', cutoffDate.toISOString());
        break;

      case 'audit_logs':
        tableName = 'data_access_audit_log';
        query = supabase
          .from('data_access_audit_log')
          .select('id')
          .lt('created_at', cutoffDate.toISOString());
        break;

      case 'document_records':
        tableName = 'documents';
        query = supabase
          .from('documents')
          .select('id')
          .lt('created_at', cutoffDate.toISOString());
        break;

      default:
        throw new Error(`Unsupported policy type: ${policyType}`);
    }

    try {
      const { data, error } = await query;
      if (error) throw error;

      const recordIds = data?.map(record => record.id) || [];
      
      logger.info(`Identified ${recordIds.length} expired records for ${policyType}`, 
        { policyType, cutoffDate, recordCount: recordIds.length }, 
        'DataRetentionService'
      );

      return {
        table: tableName,
        recordIds,
        totalCount: recordIds.length,
      };
    } catch (error) {
      logger.error(`Failed to identify expired records for ${policyType}`, error, 'DataRetentionService');
      throw error;
    }
  }

  /**
   * Schedule a retention job for automatic execution
   */
  static async scheduleRetentionJob(policyId: string, scheduledDate: Date): Promise<RetentionJob> {
    try {
      // First, get the policy details
      const { data: policy, error: policyError } = await supabase
        .from('data_retention_policies')
        .select('*')
        .eq('id', policyId)
        .single();

      if (policyError) throw policyError;

      // Identify records that will be affected
      const expiredRecords = await this.identifyExpiredRecords(
        policy.policy_type,
        policy.retention_period_months
      );

      // Create the retention job
      const { data, error } = await supabase
        .from('data_retention_jobs')
        .insert({
          policy_id: policyId,
          scheduled_date: scheduledDate.toISOString(),
          status: 'pending',
          records_identified: expiredRecords.totalCount,
          records_processed: 0,
        })
        .select()
        .single();

      if (error) throw error;

      await AuditLoggingService.logAdminAction({
        action: 'schedule_retention_job',
        changes: { 
          policy_id: policyId, 
          scheduled_date: scheduledDate.toISOString(),
          records_identified: expiredRecords.totalCount 
        },
        reason: 'Data retention job scheduled',
      });

      logger.info(`Retention job scheduled`, { jobId: data.id, policyId }, 'DataRetentionService');
      return data;
    } catch (error) {
      logger.error('Failed to schedule retention job', error, 'DataRetentionService');
      throw error;
    }
  }

  /**
   * Execute a retention job (delete expired records)
   */
  static async executeRetentionJob(jobId: string): Promise<void> {
    try {
      // Update job status to running
      await supabase
        .from('data_retention_jobs')
        .update({ 
          status: 'running',
          execution_date: new Date().toISOString()
        })
        .eq('id', jobId);

      // Get job and policy details
      const { data: job, error: jobError } = await supabase
        .from('data_retention_jobs')
        .select(`
          *,
          data_retention_policies (*)
        `)
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      const policy = job.data_retention_policies;
      
      // Get current expired records
      const expiredRecords = await this.identifyExpiredRecords(
        policy.policy_type,
        policy.retention_period_months
      );

      // Check for legal holds that might prevent deletion
      const { data: legalHolds } = await supabase
        .from('legal_holds')
        .select('record_id')
        .eq('table_name', expiredRecords.table)
        .in('record_id', expiredRecords.recordIds)
        .eq('is_active', true);

      const protectedRecords = new Set(legalHolds?.map(h => h.record_id) || []);
      const deletableRecords = expiredRecords.recordIds.filter(id => !protectedRecords.has(id));

      // Delete records in batches
      const batchSize = 100;
      let processedCount = 0;

      for (let i = 0; i < deletableRecords.length; i += batchSize) {
        const batch = deletableRecords.slice(i, i + batchSize);
        
        const { error: deleteError } = await supabase
          .from(expiredRecords.table)
          .delete()
          .in('id', batch);

        if (deleteError) {
          throw new Error(`Failed to delete batch: ${deleteError.message}`);
        }

        processedCount += batch.length;
        
        // Update job progress
        await supabase
          .from('data_retention_jobs')
          .update({ records_processed: processedCount })
          .eq('id', jobId);
      }

      // Mark job as completed
      await supabase
        .from('data_retention_jobs')
        .update({ 
          status: 'completed',
          records_processed: processedCount 
        })
        .eq('id', jobId);

      await AuditLoggingService.logAdminAction({
        action: 'execute_retention_job',
        changes: { 
          job_id: jobId,
          records_deleted: processedCount,
          records_protected: protectedRecords.size
        },
        reason: 'Data retention job executed',
      });

      logger.info(`Retention job completed`, { 
        jobId, 
        recordsDeleted: processedCount,
        recordsProtected: protectedRecords.size 
      }, 'DataRetentionService');

    } catch (error) {
      // Mark job as failed
      await supabase
        .from('data_retention_jobs')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', jobId);

      logger.error('Failed to execute retention job', error, 'DataRetentionService');
      throw error;
    }
  }

  /**
   * Get retention job status and history
   */
  static async getRetentionJobs(policyId?: string): Promise<RetentionJob[]> {
    try {
      let query = supabase
        .from('data_retention_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (policyId) {
        query = query.eq('policy_id', policyId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Failed to fetch retention jobs', error, 'DataRetentionService');
      throw error;
    }
  }

  /**
   * Cancel a pending retention job
   */
  static async cancelRetentionJob(jobId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('data_retention_jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId)
        .eq('status', 'pending');

      if (error) throw error;

      await AuditLoggingService.logAdminAction({
        action: 'cancel_retention_job',
        changes: { job_id: jobId },
        reason: 'Data retention job cancelled',
      });

      logger.info(`Retention job cancelled`, { jobId }, 'DataRetentionService');
    } catch (error) {
      logger.error('Failed to cancel retention job', error, 'DataRetentionService');
      throw error;
    }
  }
}