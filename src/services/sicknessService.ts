
import { supabase } from "@/integrations/supabase/client";
import { SicknessRecord, EntitlementUsage, SicknessEntitlementSummary, HistoricalBalance, OpeningBalanceData } from "@/types/sickness";
import { EligibilityRule } from "@/components/employees/details/work-pattern/types";
import { convertToDays } from "@/features/company-settings/components/sickness/unitUtils";

export const sicknessService = {
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

  // Fetch historical balances for an employee
  async getHistoricalBalances(employeeId: string): Promise<HistoricalBalance[]> {
    const { data, error } = await supabase
      .from('employee_sickness_historical_balances')
      .select('*')
      .eq('employee_id', employeeId)
      .order('balance_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Calculate rolling 12-month period
  getRolling12MonthPeriod(): { start: string; end: string } {
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    start.setDate(start.getDate() + 1); // Start from tomorrow last year
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  },

  // Calculate service months from hire date
  calculateServiceMonths(hireDate: string): number {
    const hire = new Date(hireDate);
    const now = new Date();
    
    const yearDiff = now.getFullYear() - hire.getFullYear();
    const monthDiff = now.getMonth() - hire.getMonth();
    
    return yearDiff * 12 + monthDiff;
  },

  // Find applicable eligibility rule based on service
  findApplicableRule(serviceMonths: number, rules: EligibilityRule[]): EligibilityRule | null {
    if (!rules || rules.length === 0) return null;

    // Sort rules by service period (convert to days for comparison)
    const sortedRules = [...rules].sort((a, b) => {
      const aServiceDays = convertToDays(a.serviceFrom, a.serviceFromUnit);
      const bServiceDays = convertToDays(b.serviceFrom, b.serviceFromUnit);
      return aServiceDays - bServiceDays;
    });

    // Convert service months to days for comparison
    const serviceDays = serviceMonths * 30; // Approximate

    // Find the highest tier the employee qualifies for
    let applicableRule = null;
    for (const rule of sortedRules) {
      const ruleFromDays = convertToDays(rule.serviceFrom, rule.serviceFromUnit);
      const ruleToDays = rule.serviceTo ? convertToDays(rule.serviceTo, rule.serviceToUnit) : Infinity;

      if (serviceDays >= ruleFromDays && serviceDays < ruleToDays) {
        applicableRule = rule;
        break;
      }
    }

    return applicableRule || sortedRules[0]; // Return first rule if none match
  },

  // Calculate entitlements based on rule and convert to days
  calculateEntitlements(rule: EligibilityRule): { fullPayDays: number; halfPayDays: number } {
    const fullPayDays = rule.fullPayUnit === 'days' ? rule.fullPayAmount : 
                       rule.fullPayUnit === 'weeks' ? rule.fullPayAmount * 7 :
                       rule.fullPayAmount * 30; // months

    const halfPayDays = rule.halfPayUnit === 'days' ? rule.halfPayAmount :
                       rule.halfPayUnit === 'weeks' ? rule.halfPayAmount * 7 :
                       rule.halfPayAmount * 30; // months

    return { fullPayDays, halfPayDays };
  },

  // Create or update entitlement usage record
  async createOrUpdateEntitlementUsage(
    employeeId: string,
    companyId: string,
    schemeId: string | null,
    serviceMonths: number,
    rule: EligibilityRule | null
  ): Promise<EntitlementUsage> {
    const currentYear = new Date().getFullYear();
    const periodStart = `${currentYear}-01-01`;
    const periodEnd = `${currentYear}-12-31`;

    const entitlements = rule ? this.calculateEntitlements(rule) : { fullPayDays: 0, halfPayDays: 0 };

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

    const { data, error } = await supabase
      .from('employee_sickness_entitlement_usage')
      .upsert(entitlementData, { 
        onConflict: 'employee_id,entitlement_period_start',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) throw error;
    return data;
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
  },

  // Record a new sickness absence
  async recordSicknessAbsence(record: Omit<SicknessRecord, 'id' | 'created_at' | 'updated_at'>): Promise<SicknessRecord> {
    const { data, error } = await supabase
      .from('employee_sickness_records')
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update sickness record
  async updateSicknessRecord(id: string, updates: Partial<SicknessRecord>): Promise<SicknessRecord> {
    const { data, error } = await supabase
      .from('employee_sickness_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete sickness record
  async deleteSicknessRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from('employee_sickness_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Calculate rolling 12-month sickness days used
  async calculateRolling12MonthUsage(employeeId: string): Promise<{ fullPayUsed: number; halfPayUsed: number }> {
    const { start, end } = this.getRolling12MonthPeriod();

    const { data, error } = await supabase
      .from('employee_sickness_records')
      .select('total_days, start_date')
      .eq('employee_id', employeeId)
      .gte('start_date', start)
      .lte('start_date', end);

    if (error) throw error;

    // For now, assume all days are full pay days
    // TODO: Implement logic to determine full pay vs half pay based on accumulated usage
    const totalUsed = data?.reduce((sum, record) => sum + record.total_days, 0) || 0;
    
    return {
      fullPayUsed: totalUsed,
      halfPayUsed: 0
    };
  },

  // Calculate total sickness days used in current year (for backward compatibility)
  async calculateUsedDays(employeeId: string): Promise<{ fullPayUsed: number; halfPayUsed: number }> {
    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;
    const yearEnd = `${currentYear}-12-31`;

    const { data, error } = await supabase
      .from('employee_sickness_records')
      .select('total_days, start_date')
      .eq('employee_id', employeeId)
      .gte('start_date', yearStart)
      .lte('start_date', yearEnd);

    if (error) throw error;

    // For now, assume all days are full pay days
    const totalUsed = data?.reduce((sum, record) => sum + record.total_days, 0) || 0;
    
    return {
      fullPayUsed: totalUsed,
      halfPayUsed: 0
    };
  }
};
