
import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { roundToTwoDecimals } from "@/lib/formatters";
import { WorkDay } from "@/components/employees/details/work-pattern/types";

// Check for duplicate payroll IDs
export const checkDuplicatePayrollIds = async (payrollIds: string[]) => {
  if (!payrollIds || payrollIds.length === 0) return [];
  
  // Filter out empty strings or undefined values
  const validIds = payrollIds.filter(id => id && id.trim() !== '');
  
  if (validIds.length === 0) return [];
  
  const { data } = await supabase
    .from("employees")
    .select("payroll_id")
    .in("payroll_id", validIds);
    
  return data ? data.map(emp => emp.payroll_id) : [];
};

// Process new employees
export const createNewEmployees = async (
  newEmployees: EmployeeData[], 
  userId: string
) => {
  // Filter out any employees without valid payroll IDs to check
  const payrollIds = newEmployees
    .filter(emp => emp.payroll_id && emp.payroll_id.trim() !== '')
    .map(emp => emp.payroll_id.trim());
  
  // Check for duplicates in the database
  const existingPayrollIds = await checkDuplicatePayrollIds(payrollIds);
  
  // If we have duplicate payroll IDs, throw an error
  if (existingPayrollIds.length > 0) {
    throw new Error(`duplicate key value violates unique constraint "unique_payroll_id" for IDs: ${existingPayrollIds.join(', ')}`);
  }
  
  for (const emp of newEmployees) {
    console.log("Creating new employee with data:", emp);
    
    // Ensure payroll ID is trimmed if present
    const payrollId = emp.payroll_id && emp.payroll_id.trim() !== '' ? emp.payroll_id.trim() : null;
    
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
      payroll_id: payrollId,
      user_id: userId,
      // Include rate fields directly in the employee record
      rate_2: roundToTwoDecimals(emp.rate_2),
      rate_3: roundToTwoDecimals(emp.rate_3),
      rate_4: roundToTwoDecimals(emp.rate_4)
    };
    
    const { data, error: insertError } = await supabase
      .from("employees")
      .insert(newEmployeeData)
      .select("id");
    
    if (insertError) throw insertError;
    
    // If we have work pattern data, insert it into the work_patterns table
    if (emp.work_pattern) {
      try {
        const employeeId = data?.[0]?.id;
        if (employeeId) {
          const workPatterns: WorkDay[] = JSON.parse(emp.work_pattern);
          
          // Insert work patterns
          const workPatternsToInsert = workPatterns.map(pattern => ({
            employee_id: employeeId,
            day: pattern.day,
            is_working: pattern.isWorking,
            start_time: pattern.startTime,
            end_time: pattern.endTime
          }));
          
          const { error } = await supabase
            .from('work_patterns')
            .insert(workPatternsToInsert);
            
          if (error) console.error("Error inserting work patterns:", error);
        }
      } catch (e) {
        console.error("Error processing work pattern data:", e);
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
      imported.payroll_id.trim() !== '' &&
      imported.payroll_id !== existing.payroll_id)
    .map(({ imported }) => imported.payroll_id.trim());
  
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
      if (key !== 'id' && key !== 'work_pattern' && 
          imported[key] !== undefined && imported[key] !== null && 
          imported[key] !== '' && imported[key] !== existing[key]) {
        
        // For payroll_id, ensure it's trimmed
        if (key === 'payroll_id' && imported[key]) {
          updates[key] = imported[key].trim();
        } else {
          updates[key] = imported[key];
        }
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
    
    // Handle work patterns if they exist in the imported data
    if (imported.work_pattern) {
      try {
        // Parse work patterns
        const workPatterns: WorkDay[] = JSON.parse(imported.work_pattern);
        
        // First delete existing work patterns
        await supabase
          .from('work_patterns')
          .delete()
          .eq('employee_id', existing.id);
          
        // Then insert new work patterns
        const workPatternsToInsert = workPatterns.map(pattern => ({
          employee_id: existing.id,
          day: pattern.day,
          is_working: pattern.isWorking,
          start_time: pattern.startTime,
          end_time: pattern.endTime
        }));
        
        if (workPatternsToInsert.length > 0) {
          const { error } = await supabase
            .from('work_patterns')
            .insert(workPatternsToInsert);
            
          if (error) console.error("Error inserting updated work patterns:", error);
        }
      } catch (e) {
        console.error("Error processing updated work pattern data:", e);
      }
    }
  }
};
