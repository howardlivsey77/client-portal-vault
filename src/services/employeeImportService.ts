
import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { createHourlyRate } from "./hourlyRateService";

// Create additional hourly rates for an employee
export const createAdditionalRates = async (employeeId: string, rates: { rate_2?: any, rate_3?: any, rate_4?: any }) => {
  try {
    // Create Rate 2 if provided and valid
    if (rates.rate_2 && !isNaN(Number(rates.rate_2)) && Number(rates.rate_2) > 0) {
      await createHourlyRate({
        employee_id: employeeId,
        rate_name: "Rate 2",
        hourly_rate: Number(rates.rate_2),
        is_default: false
      });
    }
    
    // Create Rate 3 if provided and valid
    if (rates.rate_3 && !isNaN(Number(rates.rate_3)) && Number(rates.rate_3) > 0) {
      await createHourlyRate({
        employee_id: employeeId,
        rate_name: "Rate 3",
        hourly_rate: Number(rates.rate_3),
        is_default: false
      });
    }
    
    // Create Rate 4 if provided and valid
    if (rates.rate_4 && !isNaN(Number(rates.rate_4)) && Number(rates.rate_4) > 0) {
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

// Process new employees
export const createNewEmployees = async (
  newEmployees: EmployeeData[], 
  userId: string
) => {
  for (const emp of newEmployees) {
    // Extract additional rates
    const additionalRates = {
      rate_2: emp.rate_2,
      rate_3: emp.rate_3,
      rate_4: emp.rate_4
    };
    
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
  for (const { existing, imported } of updatedEmployees) {
    // Extract additional rates
    const additionalRates = {
      rate_2: imported.rate_2,
      rate_3: imported.rate_3,
      rate_4: imported.rate_4
    };
    
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
    
    // Create additional hourly rates if provided
    await createAdditionalRates(existing.id, additionalRates);
  }
};
