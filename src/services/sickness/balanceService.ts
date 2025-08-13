
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

  // Calculate rolling 12-month sickness days used
  async calculateRolling12MonthUsage(employeeId: string): Promise<{ totalUsed: number; fullPayUsed: number; halfPayUsed: number }> {
    const { start, end } = calculationUtils.getRolling12MonthPeriod();

    const { data, error } = await supabase
      .from('employee_sickness_records')
      .select('total_days, start_date')
      .eq('employee_id', employeeId)
      .gte('start_date', start)
      .lte('start_date', end);

    if (error) throw error;

    const totalUsed = data?.reduce((sum, record) => sum + Number(record.total_days || 0), 0) || 0;
    
    // Allocation into full/half happens at a higher level
    return {
      totalUsed,
      fullPayUsed: 0,
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
