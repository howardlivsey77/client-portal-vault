
import { EligibilityRule } from "@/components/employees/details/work-pattern/types";
import { convertToDays } from "@/features/company-settings/components/sickness/unitUtils";
import { fetchWorkPatterns } from "@/components/employees/details/work-pattern/services/fetchPatterns";
import { calculateWorkingDaysPerWeek, convertEntitlementToDays } from "@/components/employees/details/sickness/utils/workPatternCalculations";

export const calculationUtils = {
  // Calculate rolling 12-month period from reference date (defaults to current date)
  getRolling12MonthPeriod(referenceDate?: string | Date): { start: string; end: string } {
    const end = referenceDate ? new Date(referenceDate) : new Date();
    const start = new Date(end);
    start.setFullYear(start.getFullYear() - 1);
    start.setDate(start.getDate() + 1); // Start from tomorrow last year
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  },

  // Calculate actual rolling period based on sickness events within the rolling window
  async getActualRollingPeriod(employeeId: string, referenceDate?: string | Date): Promise<{ start: string; end: string }> {
    try {
      // Import here to avoid circular dependencies
      const { supabase } = await import("@/integrations/supabase/client");
      
      // Get the generic rolling period first
      const genericPeriod = this.getRolling12MonthPeriod(referenceDate);
      
      // Fetch sickness records within the rolling window
      const { data: records, error } = await supabase
        .from('employee_sickness_records')
        .select('start_date')
        .eq('employee_id', employeeId)
        .gte('start_date', genericPeriod.start)
        .lte('start_date', genericPeriod.end)
        .order('start_date', { ascending: false });

      if (error) throw error;

      // If no sickness records in the period, return the generic period
      if (!records || records.length === 0) {
        return genericPeriod;
      }

      // Find the latest sickness event date within the rolling window
      const latestSicknessDate = records[0].start_date;
      
      // Calculate the period ending on the latest sickness event
      const end = new Date(latestSicknessDate);
      const start = new Date(end);
      start.setFullYear(start.getFullYear() - 1);
      start.setDate(start.getDate() + 1); // Start from tomorrow last year

      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      };
    } catch (error) {
      console.error('Error calculating actual rolling period:', error);
      // Fallback to generic period
      return this.getRolling12MonthPeriod(referenceDate);
    }
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

  // Calculate entitlements based on rule and work pattern
  async calculateEntitlements(rule: EligibilityRule, employeeId: string): Promise<{ fullPayDays: number; halfPayDays: number }> {
    try {
      console.log('Calculating entitlements for employee:', employeeId, 'with rule:', rule);
      
      // Fetch the employee's work pattern
      const workPattern = await fetchWorkPatterns(employeeId);
      const workingDaysPerWeek = calculateWorkingDaysPerWeek(workPattern);
      
      console.log('Work pattern retrieved:', workPattern);
      console.log('Working days per week:', workingDaysPerWeek);

      // Calculate entitlements using correct formula
      const fullPayDays = convertEntitlementToDays(rule.fullPayAmount, rule.fullPayUnit, workingDaysPerWeek);
      const halfPayDays = convertEntitlementToDays(rule.halfPayAmount, rule.halfPayUnit, workingDaysPerWeek);

      console.log('Calculated entitlements - Full pay:', fullPayDays, 'Half pay:', halfPayDays);

      return { fullPayDays, halfPayDays };
    } catch (error) {
      console.error('Error calculating entitlements:', error);
      // Fallback to simple calculation if work pattern fetch fails
      const fullPayDays = rule.fullPayUnit === 'days' ? rule.fullPayAmount : 
                         rule.fullPayUnit === 'weeks' ? rule.fullPayAmount * 5 : // Assume 5-day week
                         Math.floor((5 * 52.14 / 12) * rule.fullPayAmount); // months with 5-day week

      const halfPayDays = rule.halfPayUnit === 'days' ? rule.halfPayAmount :
                         rule.halfPayUnit === 'weeks' ? rule.halfPayAmount * 5 : // Assume 5-day week
                         Math.floor((5 * 52.14 / 12) * rule.halfPayAmount); // months with 5-day week

      return { fullPayDays, halfPayDays };
    }
  }
};
