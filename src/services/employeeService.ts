
import { supabase } from "@/integrations/supabase/client";
import { EmployeeFormValues, defaultWorkPattern } from "@/types/employee";
import { roundToTwoDecimals } from "@/lib/formatters";
import { WorkDay } from "@/components/employees/details/work-pattern/types";

export const fetchEmployeeById = async (id: string) => {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();
    
  if (error) throw error;
  
  return data;
};

export const createEmployee = async (employeeData: EmployeeFormValues, userId: string) => {
  try {
    // Insert the employee first
    const { data, error } = await supabase
      .from("employees")
      .insert({
        user_id: userId,
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        department: employeeData.department,
        hours_per_week: employeeData.hours_per_week,
        hourly_rate: roundToTwoDecimals(employeeData.hourly_rate),
        rate_2: roundToTwoDecimals(employeeData.rate_2),
        rate_3: roundToTwoDecimals(employeeData.rate_3),
        rate_4: roundToTwoDecimals(employeeData.rate_4),
        date_of_birth: employeeData.date_of_birth ? employeeData.date_of_birth.toISOString() : null,
        hire_date: employeeData.hire_date ? employeeData.hire_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        email: employeeData.email || null,
        address1: employeeData.address1 || null,
        address2: employeeData.address2 || null,
        address3: employeeData.address3 || null,
        address4: employeeData.address4 || null,
        postcode: employeeData.postcode || null,
        payroll_id: employeeData.payroll_id || null,
        gender: employeeData.gender || null,
      })
      .select();
    
    if (error) throw error;
    
    // Get the generated employee ID
    const employeeId = data[0].id;
    
    // Get work patterns data, either from the form or use default
    let workPatterns: WorkDay[] = defaultWorkPattern;
    if (employeeData.work_pattern) {
      try {
        workPatterns = JSON.parse(employeeData.work_pattern);
      } catch (e) {
        console.error("Failed to parse work pattern, using default:", e);
      }
    }
    
    // Insert work patterns for the employee with payroll_id
    const workPatternsToInsert = workPatterns.map(pattern => ({
      employee_id: employeeId,
      day: pattern.day,
      is_working: pattern.isWorking,
      start_time: pattern.startTime,
      end_time: pattern.endTime,
      payroll_id: employeeData.payroll_id || null
    }));
    
    const { error: patternsError } = await supabase
      .from('work_patterns')
      .insert(workPatternsToInsert);
      
    if (patternsError) {
      console.error("Failed to insert work patterns:", patternsError);
      // We don't throw this error as the employee was successfully created
    }
    
  } catch (error) {
    throw error;
  }
};

export const updateEmployee = async (id: string, employeeData: EmployeeFormValues) => {
  const { error } = await supabase
    .from("employees")
    .update({
      first_name: employeeData.first_name,
      last_name: employeeData.last_name,
      department: employeeData.department,
      hours_per_week: employeeData.hours_per_week,
      hourly_rate: roundToTwoDecimals(employeeData.hourly_rate),
      rate_2: roundToTwoDecimals(employeeData.rate_2),
      rate_3: roundToTwoDecimals(employeeData.rate_3),
      rate_4: roundToTwoDecimals(employeeData.rate_4),
      date_of_birth: employeeData.date_of_birth ? employeeData.date_of_birth.toISOString() : null,
      hire_date: employeeData.hire_date ? employeeData.hire_date.toISOString().split('T')[0] : null,
      email: employeeData.email || null,
      address1: employeeData.address1 || null,
      address2: employeeData.address2 || null,
      address3: employeeData.address3 || null,
      address4: employeeData.address4 || null,
      postcode: employeeData.postcode || null,
      payroll_id: employeeData.payroll_id || null,
      gender: employeeData.gender || null,
    })
    .eq("id", id);
    
  if (error) throw error;
  
  // Note: We don't update work patterns here as it's now handled separately
  // through the WorkPatternCard component
};
