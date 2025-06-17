
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

export const createEmployee = async (employeeData: EmployeeFormValues, userId: string, companyId: string) => {
  try {
    // Insert the employee first
    const { data, error } = await supabase
      .from("employees")
      .insert({
        user_id: userId,
        company_id: companyId,
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
    let workPatterns: WorkDay[] = defaultWorkPattern.map(pattern => ({
      ...pattern,
      payrollId: employeeData.payroll_id || null
    }));
    
    if (employeeData.work_pattern) {
      try {
        // Parse the work pattern and ensure it has payrollId
        const parsedPattern = JSON.parse(employeeData.work_pattern);
        workPatterns = parsedPattern.map((pattern: any) => ({
          ...pattern,
          payrollId: employeeData.payroll_id || null
        }));
      } catch (e) {
        console.error("Failed to parse work pattern, using default:", e);
      }
    }
    
    // Ensure all days of the week are present
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const patternsByDay = new Map();
    
    // First, add all existing patterns
    workPatterns.forEach(pattern => {
      patternsByDay.set(pattern.day, pattern);
    });
    
    // Then, ensure all days exist
    const completePattern = daysOfWeek.map(day => {
      return patternsByDay.get(day) || {
        day,
        isWorking: false,
        startTime: null,
        endTime: null
      };
    });
    
    // Insert work patterns for the employee with payroll_id
    const workPatternsToInsert = completePattern.map(pattern => ({
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

// New function to migrate payroll IDs from employees to work patterns
export const migratePayrollIdsToWorkPatterns = async () => {
  try {
    // Get all employees with their payroll_ids
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, payroll_id")
      .filter("payroll_id", "not.is", null);
    
    if (employeesError) throw employeesError;
    
    console.log(`Found ${employees?.length || 0} employees with payroll IDs to migrate`);
    
    // For each employee with a payroll_id, update their work patterns
    for (const employee of employees || []) {
      if (!employee.payroll_id) continue;
      
      // Update work patterns for this employee
      const { error: updateError } = await supabase
        .from('work_patterns')
        .update({ payroll_id: employee.payroll_id })
        .eq('employee_id', employee.id)
        .is('payroll_id', null);
      
      if (updateError) {
        console.error(`Error updating work patterns for employee ${employee.id}:`, updateError);
      } else {
        console.log(`Updated work patterns for employee ${employee.id} with payroll_id ${employee.payroll_id}`);
      }
    }
    
    return true;
  } catch (e) {
    console.error("Error in migratePayrollIdsToWorkPatterns:", e);
    return false;
  }
};

// New function to assign existing employees to a company
export const assignEmployeesToCompany = async (companyId: string) => {
  try {
    // Get all employees without a company_id
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, first_name, last_name")
      .is("company_id", null);
    
    if (employeesError) throw employeesError;
    
    console.log(`Found ${employees?.length || 0} employees without company assignment`);
    
    if (employees && employees.length > 0) {
      // Update all employees without company_id to belong to the specified company
      const { error: updateError } = await supabase
        .from('employees')
        .update({ company_id: companyId })
        .is('company_id', null);
      
      if (updateError) {
        console.error("Error assigning employees to company:", updateError);
        return false;
      } else {
        console.log(`Assigned ${employees.length} employees to company ${companyId}`);
        return true;
      }
    }
    
    return true;
  } catch (e) {
    console.error("Error in assignEmployeesToCompany:", e);
    return false;
  }
};
