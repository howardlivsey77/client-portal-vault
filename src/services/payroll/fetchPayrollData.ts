
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch payroll results for an employee
 */
export async function fetchPayrollResults(
  employeeId: string,
  limit: number = 12
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('payroll_results')
      .select('*')
      .eq('employee_id', employeeId)
      .order('payroll_period', { ascending: false })
      .limit(limit);
      
    if (error) {
      console.error("Error fetching payroll results:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching payroll results:", error);
    return [];
  }
}

/**
 * Fetch payroll results by tax year
 */
export async function fetchPayrollResultsByTaxYear(
  taxYear: string
): Promise<any[]> {
  try {
    // Extract years from tax year string (e.g., "2025-2026")
    const years = taxYear.split('-');
    const startYear = parseInt(years[0], 10);
    const endYear = parseInt(years[1], 10);
    
    // Tax year ranges from April 6 of start year to April 5 of end year
    const startDate = new Date(startYear, 3, 6); // April 6th
    const endDate = new Date(endYear, 3, 5); // April 5th
    
    const { data, error } = await supabase
      .from('payroll_results')
      .select('*')
      .gte('payroll_period', startDate.toISOString().split('T')[0])
      .lte('payroll_period', endDate.toISOString().split('T')[0])
      .order('payroll_period', { ascending: false });
      
    if (error) {
      console.error("Error fetching payroll results by tax year:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching payroll results by tax year:", error);
    return [];
  }
}
