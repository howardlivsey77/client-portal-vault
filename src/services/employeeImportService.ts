import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { roundToTwoDecimals } from "@/lib/formatters";
import { WorkDay } from "@/components/employees/details/work-pattern/types";
import { defaultWorkPattern } from "@/types/employee";
import { extractWorkPatternWithPayrollId } from "@/components/employees/import/ImportUtils";

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
    
    const { data: employeeData, error: insertError } = await supabase
      .from("employees")
      .insert(newEmployeeData)
      .select();
    
    if (insertError) throw insertError;
    
    // If we have a new employee ID and work pattern data, save the work patterns
    if (employeeData && employeeData.length > 0) {
      const employeeId = employeeData[0].id;
      
      // Get work patterns data, either from the form or use default with payrollId
      let workPatterns: WorkDay[] = defaultWorkPattern.map(pattern => ({
        ...pattern,
        payrollId: emp.payroll_id || null
      }));
      
      const extractedPatterns = extractWorkPatternWithPayrollId(emp);
      if (extractedPatterns) {
        workPatterns = extractedPatterns;
      }
      
      // Insert work patterns for the employee with payroll_id
      const workPatternsToInsert = workPatterns.map(pattern => ({
        employee_id: employeeId,
        day: pattern.day,
        is_working: pattern.isWorking,
        start_time: pattern.startTime,
        end_time: pattern.endTime,
        payroll_id: emp.payroll_id || null
      }));
      
      const { error: patternsError } = await supabase
        .from('work_patterns')
        .insert(workPatternsToInsert);
        
      if (patternsError) {
        console.error("Failed to insert work patterns:", patternsError);
        // We don't throw this error as the employee was successfully created
      }
    }
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
      
      // Update work patterns if we have them in the imported data
      if (existing.id) {
        let workPatterns: WorkDay[] = defaultWorkPattern.map(pattern => ({
          ...pattern,
          payrollId: imported.payroll_id || null
        }));
        
        const extractedPatterns = extractWorkPatternWithPayrollId(imported);
        if (extractedPatterns) {
          workPatterns = extractedPatterns;
          
          // Update work patterns with the new payroll_id
          const workPatternsToInsert = workPatterns.map(pattern => ({
            employee_id: existing.id,
            day: pattern.day,
            is_working: pattern.isWorking,
            start_time: pattern.startTime,
            end_time: pattern.endTime,
            payroll_id: imported.payroll_id || null
          }));
          
          // Delete existing work patterns
          const { error: deleteError } = await supabase
            .from('work_patterns')
            .delete()
            .eq('employee_id', existing.id);
            
          if (deleteError) {
            console.error("Failed to delete existing work patterns during update:", deleteError);
          } else {
            // Insert new work patterns
            const { error: insertError } = await supabase
              .from('work_patterns')
              .insert(workPatternsToInsert);
              
            if (insertError) {
              console.error("Failed to insert updated work patterns:", insertError);
            }
          }
        }
      }
    }
  }
};
