
import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { roundToTwoDecimals } from "@/lib/formatters";
import { WorkDay } from "@/components/employees/details/work-pattern/types";
import { checkDuplicatePayrollIds } from "./checkExistingService";

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
    
    await createWorkPatterns(emp, data?.[0]?.id);
  }
};

// Helper function to create work patterns
const createWorkPatterns = async (emp: EmployeeData, employeeId?: string) => {
  // If we have work pattern data, insert it into the work_patterns table
  if (emp.work_pattern && employeeId) {
    try {
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
    } catch (e) {
      console.error("Error processing work pattern data:", e);
    }
  }
};
