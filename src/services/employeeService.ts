
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
      job_title: employeeData.job_title,
      department: employeeData.department,
      salary: employeeData.salary,
      hours_per_week: employeeData.hours_per_week,
      hourly_rate: employeeData.hourly_rate,
      date_of_birth: employeeData.date_of_birth ? employeeData.date_of_birth.toISOString() : null,
      email: employeeData.email || null,
      phone_number: employeeData.phone_number || null,
      address1: employeeData.address1 || null,
      address2: employeeData.address2 || null,
      address3: employeeData.address3 || null,
      address4: employeeData.address4 || null,
      postcode: employeeData.postcode || null,
      emergency_contact: employeeData.emergency_contact || null,
    });
    
  if (error) throw error;
};

export const updateEmployee = async (id: string, employeeData: EmployeeFormValues) => {
  const { error } = await supabase
    .from("employees")
    .update({
      first_name: employeeData.first_name,
      last_name: employeeData.last_name,
      job_title: employeeData.job_title,
      department: employeeData.department,
      salary: employeeData.salary,
      hours_per_week: employeeData.hours_per_week,
      hourly_rate: employeeData.hourly_rate,
      date_of_birth: employeeData.date_of_birth ? employeeData.date_of_birth.toISOString() : null,
      email: employeeData.email || null,
      phone_number: employeeData.phone_number || null,
      address1: employeeData.address1 || null,
      address2: employeeData.address2 || null,
      address3: employeeData.address3 || null,
      address4: employeeData.address4 || null,
      postcode: employeeData.postcode || null,
      emergency_contact: employeeData.emergency_contact || null,
    })
    .eq("id", id);
    
  if (error) throw error;
};
