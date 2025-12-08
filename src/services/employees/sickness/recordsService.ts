
import { supabase } from "@/integrations/supabase/client";
import { SicknessRecord } from "@/types/sickness";

export const recordsService = {
  // Fetch sickness records for an employee
  async getSicknessRecords(employeeId: string): Promise<SicknessRecord[]> {
    const { data, error } = await supabase
      .from('employee_sickness_records')
      .select('*')
      .eq('employee_id', employeeId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Record a new sickness absence with automatic working days calculation
  async recordSicknessAbsence(record: Omit<SicknessRecord, 'id' | 'created_at' | 'updated_at'>): Promise<SicknessRecord> {
    // Calculate working days if we have the employee and dates
    let calculatedRecord = { ...record };
    
    if (record.employee_id && record.start_date) {
      try {
        // Get employee's work pattern
        const { data: workPatterns } = await supabase
          .from('work_patterns')
          .select('day, is_working, start_time, end_time')
          .eq('employee_id', record.employee_id);

        if (workPatterns && workPatterns.length > 0) {
          const { calculateWorkingDaysForRecord } = await import('@/components/employees/details/sickness/utils/workingDaysCalculations');
          
          const workPattern = workPatterns.map(wp => ({
            day: wp.day,
            isWorking: wp.is_working,
            startTime: wp.start_time || '',
            endTime: wp.end_time || '',
            payrollId: '' 
          }));
          
          const calculatedWorkingDays = calculateWorkingDaysForRecord(
            record.start_date,
            record.end_date || null,
            workPattern
          );
          
          // Use calculated working days instead of provided total_days
          calculatedRecord.total_days = calculatedWorkingDays;
          console.log(`Calculated working days for sickness record: ${calculatedWorkingDays}`);
        }
      } catch (error) {
        console.warn('Could not calculate working days, using provided value:', error);
      }
    }
    // Some deployments do not return the inserted row due to RLS/return=minimal.
    // Use maybeSingle() and fall back to fetching the latest record for the employee.
    const { data, error } = await supabase
      .from('employee_sickness_records')
      .insert(calculatedRecord)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (data) {
      // Trigger entitlement recalculation using the sickness start date as reference
      await this.recalculateEntitlementWithReference(calculatedRecord.employee_id, calculatedRecord.start_date);
      return data as SicknessRecord;
    }

    // Fallback: fetch the most recent record for this employee (assumes sequential inserts)
    const { data: fallback, error: fallbackError } = await supabase
      .from('employee_sickness_records')
      .select('*')
      .eq('employee_id', calculatedRecord.employee_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fallbackError) throw fallbackError;
    if (!fallback) throw new Error('Sickness record inserted but no row returned');
    
    // Trigger entitlement recalculation using the sickness start date as reference
    await this.recalculateEntitlementWithReference(calculatedRecord.employee_id, calculatedRecord.start_date);
    return fallback as SicknessRecord;
  },

  // Helper method to recalculate entitlements using reference date
  async recalculateEntitlementWithReference(employeeId: string, referenceDate: string) {
    // Import services to avoid circular dependencies
    const { sicknessService } = await import("@/services/employees");
    const { calculateSicknessEntitlementSummary } = await import("@/utils");
    
    // Get employee details
    const { data: employeeData, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .maybeSingle();
    
    if (error || !employeeData) {
      console.warn('Could not fetch employee for entitlement recalculation:', employeeId, error);
      return;
    }

    try {
      // Cast to Employee type with default monthly_salary (not in database but required by interface)
      const employee = {
        ...employeeData,
        monthly_salary: null
      } as any; // Type assertion to handle database vs interface differences
      
      // Recalculate using the reference date
      await calculateSicknessEntitlementSummary(employee, referenceDate);
    } catch (error) {
      console.error('Error recalculating entitlements with reference date:', error);
    }
  },

  // Update sickness record
  async updateSicknessRecord(id: string, updates: Partial<SicknessRecord>): Promise<SicknessRecord> {
    const { data, error } = await supabase
      .from('employee_sickness_records')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (data) {
      // If start_date was updated, recalculate using new date as reference
      if (updates.start_date) {
        await this.recalculateEntitlementWithReference(data.employee_id, updates.start_date);
      }
      return data as SicknessRecord;
    }

    // Fallback: fetch the record by id
    const { data: fallback, error: fallbackError } = await supabase
      .from('employee_sickness_records')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fallbackError) throw fallbackError;
    if (!fallback) throw new Error('Sickness record updated but no row returned');
    
    // If start_date was updated, recalculate using new date as reference
    if (updates.start_date) {
      await this.recalculateEntitlementWithReference(fallback.employee_id, updates.start_date);
    }
    return fallback as SicknessRecord;
  },

  // Delete sickness record
  async deleteSicknessRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from('employee_sickness_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
