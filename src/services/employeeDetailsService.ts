
import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/types/employeeDetails";
import { fetchAdjacentEmployees } from "./employeeNavigationService";

export const fetchEmployeeById = async (employeeId: string): Promise<Employee> => {
  console.log("Fetching employee data for ID:", employeeId);
  
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .single();
    
  if (error) throw error;
  
  console.log("Employee data retrieved:", data);
  // Cast to Employee with all fields possibly undefined to match our type
  return data as unknown as Employee;
};

export const updateEmployeeFieldById = async (
  employeeId: string, 
  fieldName: string, 
  value: any
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("employees")
      .update({ [fieldName]: value })
      .eq("id", employeeId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating employee field:", error);
    throw error;
  }
};

export const deleteEmployeeById = async (employeeId: string): Promise<void> => {
  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("id", employeeId);
  
  if (error) throw error;
};

export const fetchEmployeeWithNavigation = async (employeeId: string): Promise<{
  employee: Employee;
  nextEmployeeId: string | null;
  prevEmployeeId: string | null;
}> => {
  const employee = await fetchEmployeeById(employeeId);
  
  const { nextEmployeeId, prevEmployeeId } = await fetchAdjacentEmployees(
    employee.last_name,
    employee.first_name,
    employee.id
  );
  
  return { employee, nextEmployeeId, prevEmployeeId };
};

