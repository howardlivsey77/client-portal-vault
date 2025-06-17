
import { supabase } from "@/integrations/supabase/client";

/**
 * Check for duplicate payroll IDs in the database
 */
export const checkDuplicatePayrollIds = async (payrollIds: string[]): Promise<string[]> => {
  if (!payrollIds || payrollIds.length === 0) return [];
  
  const { data } = await supabase
    .from("employees")
    .select("payroll_id")
    .in("payroll_id", payrollIds);
    
  return data ? data.map(emp => emp.payroll_id) : [];
};
