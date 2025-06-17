
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

/**
 * Check for duplicate payroll IDs within the import data itself
 */
export const checkDuplicatesInImportData = (payrollIds: string[]): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  
  for (const id of payrollIds) {
    if (seen.has(id)) {
      duplicates.add(id);
    } else {
      seen.add(id);
    }
  }
  
  return Array.from(duplicates);
};
