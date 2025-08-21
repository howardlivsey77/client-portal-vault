
import { supabase } from "@/integrations/supabase/client";
import { HistoricalBalance } from "@/types/sickness";
import { calculationUtils } from "./calculationUtils";

export const balanceService = {
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

  // Calculate rolling 12-month sickness days used (overlap-aware)
  async calculateRolling12MonthUsage(employeeId: string): Promise<{ totalUsed: number; fullPayUsed: number; halfPayUsed: number }> {
    const { start, end } = calculationUtils.getRolling12MonthPeriod();

    // Fetch candidate records up to range end; filter overlaps in code to catch spells that start before the window
    const { data, error } = await supabase
      .from('employee_sickness_records')
      .select('total_days, start_date, end_date')
      .eq('employee_id', employeeId)
      .lte('start_date', end);

    if (error) throw error;

    const rangeStart = new Date(start);
    const rangeEnd = new Date(end);

    const totalUsed = (data || []).reduce((sum, r) => {
      const recStart = new Date(r.start_date as string);
      const recEnd = new Date((r.end_date as string) || r.start_date as string);
      // Overlaps if recordStart <= rangeEnd and recordEnd >= rangeStart
      const overlaps = recStart <= rangeEnd && recEnd >= rangeStart;
      return overlaps ? sum + Number(r.total_days || 0) : sum;
    }, 0);
    
    // Allocation into full/half happens at a higher level
    return {
      totalUsed,
      fullPayUsed: totalUsed,
      halfPayUsed: 0
    };
  },

  // Calculate total sickness days used in current year (for backward compatibility)
  async calculateUsedDays(employeeId: string): Promise<{ totalUsed: number; fullPayUsed: number; halfPayUsed: number }> {
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

    const totalUsed = data?.reduce((sum, record) => sum + Number(record.total_days || 0), 0) || 0;
    
    // Allocation handled at summary level
    return {
      totalUsed,
      fullPayUsed: 0,
      halfPayUsed: 0
    };
  }
};
