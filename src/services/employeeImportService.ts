
import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { createHourlyRate } from "./hourlyRateService";

// Create additional hourly rates for an employee
export const createAdditionalRates = async (employeeId: string, rates: { rate_2?: any, rate_3?: any, rate_4?: any }) => {
  try {
    console.log("Creating additional rates for employee", employeeId, "with rates:", rates);
    
    // Create Rate 2 if provided and valid
    if (rates.rate_2 && !isNaN(Number(rates.rate_2)) && Number(rates.rate_2) > 0) {
      console.log("Creating Rate 2:", rates.rate_2);
      await createHourlyRate({
        employee_id: employeeId,
        rate_name: "Rate 2",
        hourly_rate: Number(rates.rate_2),
        is_default: false
      });
    }
    
    // Create Rate 3 if provided and valid
    if (rates.rate_3 && !isNaN(Number(rates.rate_3)) && Number(rates.rate_3) > 0) {
      console.log("Creating Rate 3:", rates.rate_3);
      await createHourlyRate({
        employee_id: employeeId,
        rate_name: "Rate 3",
        hourly_rate: Number(rates.rate_3),
        is_default: false
      });
    }
    
    // Create Rate 4 if provided and valid
    if (rates.rate_4 && !isNaN(Number(rates.rate_4)) && Number(rates.rate_4) > 0) {
      console.log("Creating Rate 4:", rates.rate_4);
      await createHourlyRate({
        employee_id: employeeId,
        rate_name: "Rate 4",
        hourly_rate: Number(rates.rate_4),
        is_default: false
      });
    }
  } catch (error) {
    console.error("Error creating additional hourly rates:", error);
    // Continue with the import even if rate creation fails
  }
};

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
    // Extract additional rates
    const additionalRates = {
      rate_2: emp.rate_2,
      rate_3: emp.rate_3,
      rate_4: emp.rate_4
    };
    
    console.log("Creating new employee with data:", emp);
    console.log("Additional rates:", additionalRates);
    
    // Insert the employee
    const newEmployeeData = {
      first_name: emp.first_name,
      last_name: emp.last_name,
      department: emp.department,
      hours_per_week: emp.hours_per_week || 40,
      hourly_rate: emp.hourly_rate || 0,
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
    };
    
    const { data: employeeInsertData, error: insertError } = await supabase
      .from("employees")
      .insert(newEmployeeData)
      .select()
      .single();
    
    if (insertError) throw insertError;
    
    // Create additional hourly rates if provided
    if (employeeInsertData) {
      await createAdditionalRates(employeeInsertData.id, additionalRates);
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
    // Extract additional rates
    const additionalRates = {
      rate_2: imported.rate_2,
      rate_3: imported.rate_3,
      rate_4: imported.rate_4
    };
    
    console.log("Updating employee:", existing.id);
    console.log("Additional rates:", additionalRates);
    
    const updates: any = {};
    
    // Only include fields that have changed and are not rate fields
    Object.keys(imported).forEach(key => {
      if (key !== 'id' && !key.startsWith('rate_') && 
          imported[key] !== undefined && imported[key] !== null && 
          imported[key] !== '' && imported[key] !== existing[key]) {
        updates[key] = imported[key];
      }
    });
    
    // Update employee if there are changes
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("employees")
        .update(updates)
        .eq("id", existing.id);
      
      if (updateError) throw updateError;
    }
    
    // Create additional hourly rates if provided, regardless of whether they exist already
    // This will create new rate entries each time an import is done with rates
    await createAdditionalRates(existing.id, additionalRates);
  }
};
