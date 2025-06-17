
import { supabase } from "@/integrations/supabase/client";
import { EntitlementUsage, OpeningBalanceData } from "@/types/sickness";
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

    // Get existing record to preserve opening balance
    const existing = await this.getEntitlementUsage(employeeId);
    
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
      current_rule_id: rule?.id || null,
      // Preserve existing opening balance data
      opening_balance_full_pay: existing?.opening_balance_full_pay || 0,
      opening_balance_half_pay: existing?.opening_balance_half_pay || 0,
      opening_balance_date: existing?.opening_balance_date || null,
      opening_balance_notes: existing?.opening_balance_notes || null
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

  // Set opening balance for an employee
  async setOpeningBalance(
    employeeId: string,
    companyId: string,
    openingBalance: OpeningBalanceData
  ): Promise<EntitlementUsage> {
    const currentYear = new Date().getFullYear();
    const periodStart = `${currentYear}-01-01`;

    const updateData = {
      opening_balance_full_pay: openingBalance.full_pay_days,
      opening_balance_half_pay: openingBalance.half_pay_days,
      opening_balance_date: openingBalance.reference_date,
      opening_balance_notes: openingBalance.notes || null
    };

    const { data, error } = await supabase
      .from('employee_sickness_entitlement_usage')
      .update(updateData)
      .eq('employee_id', employeeId)
      .eq('entitlement_period_start', periodStart)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
