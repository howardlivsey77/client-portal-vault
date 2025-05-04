
import { supabase } from "@/integrations/supabase/client";
import { EmployeeFormValues } from "@/types/employee";

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
  const { error } = await supabase
    .from("employees")
    .insert({
      user_id: userId,
      first_name: employeeData.first_name,
      last_name: employeeData.last_name,
      department: employeeData.department,
      hours_per_week: employeeData.hours_per_week,
      hourly_rate: employeeData.hourly_rate,
      date_of_birth: employeeData.date_of_birth ? employeeData.date_of_birth.toISOString() : null,
      hire_date: employeeData.hire_date ? employeeData.hire_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      email: employeeData.email || null,
      address1: employeeData.address1 || null,
      address2: employeeData.address2 || null,
      address3: employeeData.address3 || null,
      address4: employeeData.address4 || null,
      postcode: employeeData.postcode || null,
      payroll_id: employeeData.payroll_id || null,
    });
    
  if (error) throw error;
};

export const updateEmployee = async (id: string, employeeData: EmployeeFormValues) => {
  const { error } = await supabase
    .from("employees")
    .update({
      first_name: employeeData.first_name,
      last_name: employeeData.last_name,
      department: employeeData.department,
      hours_per_week: employeeData.hours_per_week,
      hourly_rate: employeeData.hourly_rate,
      date_of_birth: employeeData.date_of_birth ? employeeData.date_of_birth.toISOString() : null,
      hire_date: employeeData.hire_date ? employeeData.hire_date.toISOString().split('T')[0] : null,
      email: employeeData.email || null,
      address1: employeeData.address1 || null,
      address2: employeeData.address2 || null,
      address3: employeeData.address3 || null,
      address4: employeeData.address4 || null,
      postcode: employeeData.postcode || null,
      payroll_id: employeeData.payroll_id || null,
    })
    .eq("id", id);
    
  if (error) throw error;
};
