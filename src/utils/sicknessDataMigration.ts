import { sicknessService } from "@/services/employees";
import { supabase } from "@/integrations/supabase/client";

export const sicknessDataMigration = {
  // Run complete data migration to fix all sickness entitlement issues
  async runCompleteMigration(): Promise<void> {
    console.log('Starting complete sickness data migration...');
    
    try {
      // Step 1: Sync entitlements for all employees
      console.log('Step 1: Syncing employee entitlements...');
      await sicknessService.syncAllEmployeeEntitlements();
      
      // Step 2: Recalculate used days for all employees
      console.log('Step 2: Recalculating used days...');
      await sicknessService.recalculateAllUsedDays();
      
      // Step 3: Assign missing sickness schemes
      console.log('Step 3: Assigning missing sickness schemes...');
      await this.assignMissingSicknessSchemes();
      
      console.log('Migration completed successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  // Assign default sickness scheme to employees without one
  async assignMissingSicknessSchemes(): Promise<void> {
    console.log('Assigning missing sickness schemes...');
    
    // Get employees without sickness schemes
    const { data: employeesWithoutScheme, error: employeeError } = await supabase
      .from('employees')
      .select('id, company_id')
      .is('sickness_scheme_id', null);

    if (employeeError) throw employeeError;

    if (!employeesWithoutScheme || employeesWithoutScheme.length === 0) {
      console.log('No employees found without sickness schemes');
      return;
    }

    console.log(`Found ${employeesWithoutScheme.length} employees without sickness schemes`);

    // Get default sickness scheme for each company
    const companyIds = [...new Set(employeesWithoutScheme.map(e => e.company_id))];
    
    for (const companyId of companyIds) {
      if (!companyId) continue;
      
      // Get first available sickness scheme for the company
      const { data: scheme } = await supabase
        .from('sickness_schemes')
        .select('id')
        .eq('company_id', companyId)
        .limit(1)
        .single();

      if (scheme) {
        // Update all employees in this company
        const companyEmployees = employeesWithoutScheme.filter(e => e.company_id === companyId);
        
        for (const employee of companyEmployees) {
          try {
            await supabase
              .from('employees')
              .update({ sickness_scheme_id: scheme.id })
              .eq('id', employee.id);
            
            console.log(`Assigned scheme ${scheme.id} to employee ${employee.id}`);
          } catch (error) {
            console.error(`Failed to assign scheme to employee ${employee.id}:`, error);
          }
        }
      } else {
        console.log(`No sickness scheme found for company ${companyId}`);
      }
    }
  },

  // Check data integrity and report issues
  async checkDataIntegrity(): Promise<{
    employeesWithoutSchemes: number;
    employeesWithoutEntitlements: number;
    recordsWithoutEntitlementUpdates: number;
  }> {
    console.log('Checking sickness data integrity...');

    // Check employees without sickness schemes
    const { data: employeesWithoutSchemes } = await supabase
      .from('employees')
      .select('id')
      .is('sickness_scheme_id', null);

    // Check employees with sickness records but no entitlement records
    const { data: employeesWithSickness } = await supabase
      .from('employee_sickness_records')
      .select('employee_id')
      .not('employee_id', 'is', null);

    const currentYear = new Date().getFullYear();
    const { data: entitlementRecords } = await supabase
      .from('employee_sickness_entitlement_usage')
      .select('employee_id')
      .gte('entitlement_period_start', `${currentYear}-01-01`);

    const employeesWithSicknessIds = new Set(employeesWithSickness?.map(r => r.employee_id) || []);
    const employeesWithEntitlementsIds = new Set(entitlementRecords?.map(r => r.employee_id) || []);
    
    const employeesWithoutEntitlements = [...employeesWithSicknessIds].filter(
      id => !employeesWithEntitlementsIds.has(id)
    ).length;

    // Check records with zero used days (indicating they haven't been updated)
    const { data: recordsWithZeroUsed } = await supabase
      .from('employee_sickness_entitlement_usage')
      .select('id')
      .eq('full_pay_used_days', 0)
      .eq('half_pay_used_days', 0)
      .gte('entitlement_period_start', `${currentYear}-01-01`);

    const report = {
      employeesWithoutSchemes: employeesWithoutSchemes?.length || 0,
      employeesWithoutEntitlements,
      recordsWithoutEntitlementUpdates: recordsWithZeroUsed?.length || 0
    };

    console.log('Data integrity report:', report);
    return report;
  }
};