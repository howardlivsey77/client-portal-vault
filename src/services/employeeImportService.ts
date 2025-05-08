
import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { roundToTwoDecimals } from "@/lib/formatters";

// Check for duplicate payroll IDs
export const checkDuplicatePayrollIds = async (payrollIds: string[]) => {
  if (!payrollIds || payrollIds.length === 0) return [];
  
  const { data } = await supabase
    .from("employees")
    .select("payroll_id")
    .in("payroll_id", payrollIds);
    
  return data ? data.map(emp => emp.payroll_id) : [];
};

// Process new employees
export const createNewEmployees = async (
  newEmployees: EmployeeData[], 
  userId: string
) => {
  // Extract all payroll IDs that are not empty
  const payrollIds = newEmployees
    .filter(emp => emp.payroll_id && emp.payroll_id.trim() !== '')
    .map(emp => emp.payroll_id);
  
  // Check for duplicates in the database
  const existingPayrollIds = await checkDuplicatePayrollIds(payrollIds);
  
  // If we have duplicate payroll IDs, throw an error
  if (existingPayrollIds.length > 0) {
    throw new Error(`duplicate key value violates unique constraint "unique_payroll_id" for IDs: ${existingPayrollIds.join(', ')}`);
  }
  
  for (const emp of newEmployees) {
    console.log("Creating new employee with data:", emp);
    
    // Insert the employee with all rate fields
    const newEmployeeData = {
      first_name: emp.first_name,
      last_name: emp.last_name,
      department: emp.department,
      hours_per_week: emp.hours_per_week || 40,
      hourly_rate: roundToTwoDecimals(emp.hourly_rate) || 0,
      email: emp.email || null,
      address1: emp.address1 || null,
      address2: emp.address2 || null,
      address3: emp.address3 || null,
      address4: emp.address4 || null,
      postcode: emp.postcode || null,
      date_of_birth: emp.date_of_birth || null,
      hire_date: emp.hire_date || null,
      payroll_id: emp.payroll_id || null,
      user_id: userId,
      // Include rate fields directly in the employee record
      rate_2: roundToTwoDecimals(emp.rate_2),
      rate_3: roundToTwoDecimals(emp.rate_3),
      rate_4: roundToTwoDecimals(emp.rate_4)
    };
    
    const { error: insertError } = await supabase
      .from("employees")
      .insert(newEmployeeData);
    
    if (insertError) throw insertError;
  }
};

// Process updated employees
export const updateExistingEmployees = async (
  updatedEmployees: {existing: EmployeeData; imported: EmployeeData}[]
) => {
  // Extract all new payroll IDs from updates where they differ from existing
  const newPayrollIds = updatedEmployees
    .filter(({ existing, imported }) => 
      imported.payroll_id && 
      imported.payroll_id !== existing.payroll_id &&
      imported.payroll_id.trim() !== '')
    .map(({ imported }) => imported.payroll_id);
  
  // Check for duplicates in the database if we have any new payroll IDs
  if (newPayrollIds.length > 0) {
    const existingPayrollIds = await checkDuplicatePayrollIds(newPayrollIds);
    
    // If we have duplicate payroll IDs, throw an error
    if (existingPayrollIds.length > 0) {
      throw new Error(`duplicate key value violates unique constraint "unique_payroll_id" for IDs: ${existingPayrollIds.join(', ')}`);
    }
  }
  
  for (const { existing, imported } of updatedEmployees) {
    console.log("Updating employee:", existing.id);
    
    const updates: any = {};
    
    // Only include fields that have changed
    Object.keys(imported).forEach(key => {
      if (key !== 'id' && 
          imported[key] !== undefined && imported[key] !== null && 
          imported[key] !== '' && imported[key] !== existing[key]) {
        updates[key] = imported[key];
      }
    });
    
    // Always include rounded rate fields in updates if they exist in the imported data
    if (imported.rate_2 !== undefined) updates.rate_2 = roundToTwoDecimals(imported.rate_2);
    if (imported.rate_3 !== undefined) updates.rate_3 = roundToTwoDecimals(imported.rate_3);
    if (imported.rate_4 !== undefined) updates.rate_4 = roundToTwoDecimals(imported.rate_4);
    
    // Update hourly_rate with rounding
    if (imported.hourly_rate !== undefined) {
      updates.hourly_rate = roundToTwoDecimals(imported.hourly_rate);
    }
    
    // Update employee if there are changes
    if (Object.keys(updates).length > 0) {
      console.log("Updating employee with data:", updates);
      const { error: updateError } = await supabase
        .from("employees")
        .update(updates)
        .eq("id", existing.id);
      
      if (updateError) throw updateError;
    }
  }
};
