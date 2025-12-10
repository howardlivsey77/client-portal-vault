
import { supabase } from "@/integrations/supabase/client";
import { EntitlementUsage } from "@/types";
import { EligibilityRule } from "@/components/employees/details/work-pattern/types";
import { calculationUtils } from "./calculationUtils";

export const entitlementService = {
  // Fetch entitlement usage for an employee
  async getEntitlementUsage(employeeId: string): Promise<EntitlementUsage | null> {
    const currentYear = new Date().getFullYear();
    const { data, error } = await supabase
      .from('employee_sickness_entitlement_usage')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('entitlement_period_start', `${currentYear}-01-01`)
      .lte('entitlement_period_end', `${currentYear}-12-31`)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Recalculate entitlement for existing employee
  async recalculateExistingEntitlement(
    employeeId: string,
    companyId: string,
    schemeId: string | null,
    serviceMonths: number,
    rule: EligibilityRule | null
  ): Promise<EntitlementUsage | null> {
    console.log('Recalculating entitlement for employee:', employeeId);
    
    const currentYear = new Date().getFullYear();
    const periodStart = `${currentYear}-01-01`;
    const periodEnd = `${currentYear}-12-31`;

    const entitlements = rule ? await calculationUtils.calculateEntitlements(rule, employeeId) : { fullPayDays: 0, halfPayDays: 0 };

    const entitlementData = {
      employee_id: employeeId,
      company_id: companyId,
      sickness_scheme_id: schemeId,
      entitlement_period_start: periodStart,
      entitlement_period_end: periodEnd,
      full_pay_entitled_days: entitlements.fullPayDays,
      half_pay_entitled_days: entitlements.halfPayDays,
      current_service_months: serviceMonths,
      current_rule_id: rule?.id || null
    };

    console.log('Updating entitlement with data:', entitlementData);

    const { data, error } = await supabase
      .from('employee_sickness_entitlement_usage')
      .upsert(entitlementData, { 
        onConflict: 'employee_id,entitlement_period_start',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating entitlement:', error);
      throw error;
    }
    
    console.log('Entitlement updated successfully:', data);
    return data;
  },

  // Create or update entitlement usage record
  async createOrUpdateEntitlementUsage(
    employeeId: string,
    companyId: string,
    schemeId: string | null,
    serviceMonths: number,
    rule: EligibilityRule | null
  ): Promise<EntitlementUsage> {
    return this.recalculateExistingEntitlement(employeeId, companyId, schemeId, serviceMonths, rule);
  },


  // Update used days in entitlement record
  async updateUsedDays(
    employeeId: string,
    usedDays: {
      fullPayUsed: number;
      halfPayUsed: number;
      fullPayUsedRolling12Months?: number;
      halfPayUsedRolling12Months?: number;
    }
  ): Promise<void> {
    const currentYear = new Date().getFullYear();
    const periodStart = `${currentYear}-01-01`;

    const { error } = await supabase
      .from('employee_sickness_entitlement_usage')
      .update({
        full_pay_used_days: usedDays.fullPayUsed,
        half_pay_used_days: usedDays.halfPayUsed
      })
      .eq('employee_id', employeeId)
      .eq('entitlement_period_start', periodStart);

    if (error) {
      console.error('Error updating used days:', error);
      throw error;
    }
  },

  // Sync all employee entitlements - creates missing records and assigns schemes
  async syncAllEmployeeEntitlements(): Promise<void> {
    console.log('Starting entitlement sync for all employees...');
    
    // Get all employees with sickness records but missing entitlement records
    const { data: employeesWithSickness, error: sicknessError } = await supabase
      .from('employee_sickness_records')
      .select(`
        employee_id,
        employees!inner(
          id,
          company_id,
          sickness_scheme_id,
          hire_date
        )
      `)
      .not('employees.sickness_scheme_id', 'is', null);

    if (sicknessError) throw sicknessError;

    // Get all existing entitlement records for current year
    const currentYear = new Date().getFullYear();
    const { data: existingEntitlements, error: entitlementError } = await supabase
      .from('employee_sickness_entitlement_usage')
      .select('employee_id')
      .gte('entitlement_period_start', `${currentYear}-01-01`)
      .lte('entitlement_period_end', `${currentYear}-12-31`);

    if (entitlementError) throw entitlementError;

    const existingEmployeeIds = new Set(existingEntitlements?.map(e => e.employee_id) || []);
    
    // Get unique employees from sickness records
    const uniqueEmployees = employeesWithSickness?.reduce((acc, record) => {
      const employee = record.employees;
      if (!acc.find(e => e.id === employee.id)) {
        acc.push(employee);
      }
      return acc;
    }, [] as any[]) || [];

    console.log(`Found ${uniqueEmployees.length} employees with sickness records`);

    // Process employees missing entitlement records
    for (const employee of uniqueEmployees) {
      if (!existingEmployeeIds.has(employee.id)) {
        console.log(`Creating entitlement record for employee ${employee.id}`);
        
        try {
          const serviceMonths = calculationUtils.calculateServiceMonths(employee.hire_date);
          
          // Get sickness scheme rules
          const { data: scheme } = await supabase
            .from('sickness_schemes')
            .select('eligibility_rules')
            .eq('id', employee.sickness_scheme_id)
            .single();

          const rules = (scheme?.eligibility_rules as unknown as EligibilityRule[]) || [];
          const rule = calculationUtils.findApplicableRule(serviceMonths, rules);
          
          await this.createOrUpdateEntitlementUsage(
            employee.id,
            employee.company_id,
            employee.sickness_scheme_id,
            serviceMonths,
            rule
          );
        } catch (error) {
          console.error(`Failed to create entitlement for employee ${employee.id}:`, error);
        }
      }
    }

    console.log('Entitlement sync completed');
  },

  // Recalculate and persist used days for all employees
  async recalculateAllUsedDays(): Promise<void> {
    console.log('Recalculating used days for all employees...');

    const { data: entitlements, error } = await supabase
      .from('employee_sickness_entitlement_usage')
      .select('employee_id')
      .gte('entitlement_period_start', `${new Date().getFullYear()}-01-01`);

    if (error) throw error;

    for (const entitlement of entitlements || []) {
      try {
        await this.recalculateEmployeeUsedDays(entitlement.employee_id);
      } catch (error) {
        console.error(`Failed to recalculate used days for employee ${entitlement.employee_id}:`, error);
      }
    }

    console.log('Used days recalculation completed');
  },

  // Recalculate used days for a specific employee
  async recalculateEmployeeUsedDays(employeeId: string): Promise<void> {
    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;
    const yearEnd = `${currentYear}-12-31`;

    // Get employee with sickness scheme
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('sickness_scheme_id, hire_date')
      .eq('id', employeeId)
      .single();

    if (empError) throw empError;

    // Get entitlement record to know allowances
    const { data: entitlement, error: entError } = await supabase
      .from('employee_sickness_entitlement_usage')
      .select('full_pay_entitled_days, half_pay_entitled_days, current_rule_id')
      .eq('employee_id', employeeId)
      .gte('entitlement_period_start', yearStart)
      .lte('entitlement_period_end', yearEnd)
      .single();

    if (entError && entError.code !== 'PGRST116') throw entError;

    // Get sickness scheme to check for waiting days
    let hasWaitingDays = false;
    if (employee?.sickness_scheme_id) {
      const { data: scheme } = await supabase
        .from('sickness_schemes')
        .select('eligibility_rules')
        .eq('id', employee.sickness_scheme_id)
        .single();

      if (scheme?.eligibility_rules && entitlement?.current_rule_id) {
        const rules = scheme.eligibility_rules as unknown as EligibilityRule[];
        const currentRule = rules.find(r => r.id === entitlement.current_rule_id);
        hasWaitingDays = currentRule?.hasWaitingDays || false;
      }
    }

    // Get all sickness records for current year, sorted by date
    const { data: records, error } = await supabase
      .from('employee_sickness_records')
      .select('total_days, start_date')
      .eq('employee_id', employeeId)
      .gte('start_date', yearStart)
      .lte('start_date', yearEnd)
      .order('start_date', { ascending: true });

    if (error) throw error;

    const fullPayAllowance = Number(entitlement?.full_pay_entitled_days || 0);
    const halfPayAllowance = Number(entitlement?.half_pay_entitled_days || 0);
    
    let fullPayUsed = 0;
    let halfPayUsed = 0;
    let availableFullPay = fullPayAllowance;
    let availableHalfPay = halfPayAllowance;

    // Process each record chronologically
    for (const record of records || []) {
      const totalDays = Number(record.total_days || 0);
      
      // Apply waiting days (3 days per absence if enabled)
      const waitingDays = hasWaitingDays ? Math.min(totalDays, 3) : 0;
      let payableDays = totalDays - waitingDays;

      // Allocate payable days to full pay first
      const allocateToFull = Math.min(payableDays, availableFullPay);
      fullPayUsed += allocateToFull;
      availableFullPay -= allocateToFull;
      payableDays -= allocateToFull;

      // Then allocate remaining to half pay
      const allocateToHalf = Math.min(payableDays, availableHalfPay);
      halfPayUsed += allocateToHalf;
      availableHalfPay -= allocateToHalf;
      // Any remaining days are no pay
    }

    await this.updateUsedDays(employeeId, {
      fullPayUsed,
      halfPayUsed
    });
  }
};
