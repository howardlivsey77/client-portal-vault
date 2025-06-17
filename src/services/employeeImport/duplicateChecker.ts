
import { supabase } from "@/integrations/supabase/client";

/**
 * Check for duplicate payroll IDs in the database
 */
export const checkDuplicatePayrollIds = async (payrollIds: string[]): Promise<string[]> => {
  console.log('Checking for duplicate payroll IDs in database:', payrollIds);
  
  if (!payrollIds || payrollIds.length === 0) {
    console.log('No payroll IDs to check');
    return [];
  }
  
  // Filter out any null, undefined, or empty payroll IDs
  const validPayrollIds = payrollIds.filter(id => id && id.trim() !== '');
  console.log('Valid payroll IDs for database check:', validPayrollIds);
  
  if (validPayrollIds.length === 0) {
    console.log('No valid payroll IDs after filtering');
    return [];
  }
  
  const { data, error } = await supabase
    .from("employees")
    .select("payroll_id")
    .in("payroll_id", validPayrollIds);
  
  if (error) {
    console.error('Error checking for duplicate payroll IDs:', error);
    throw error;
  }
  
  const duplicates = data ? data.map(emp => emp.payroll_id) : [];
  console.log('Found duplicate payroll IDs in database:', duplicates);
  
  return duplicates;
};

/**
 * Check for duplicate payroll IDs within the import data itself
 */
export const checkDuplicatesInImportData = (payrollIds: string[]): string[] => {
  console.log('Checking for internal duplicates in payroll IDs:', payrollIds);
  
  if (!payrollIds || payrollIds.length === 0) {
    console.log('No payroll IDs to check for internal duplicates');
    return [];
  }
  
  // Filter out null, undefined, or empty values first
  const validPayrollIds = payrollIds.filter(id => id && id.trim() !== '');
  console.log('Valid payroll IDs for internal duplicate check:', validPayrollIds);
  
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  
  for (const id of validPayrollIds) {
    const normalizedId = id.trim();
    console.log(`Processing payroll ID: "${id}" -> normalized: "${normalizedId}"`);
    
    if (seen.has(normalizedId)) {
      console.log(`Found internal duplicate: "${normalizedId}"`);
      duplicates.add(normalizedId);
    } else {
      seen.add(normalizedId);
    }
  }
  
  const result = Array.from(duplicates);
  console.log('Internal duplicates found:', result);
  
  return result;
};
