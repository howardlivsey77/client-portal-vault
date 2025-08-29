
import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/types/employeeDetails";
import { fetchAdjacentEmployees } from "./employeeNavigationService";
import { logger } from "./loggingService";
import { AppError, createServiceResponse, ApiResponse } from "@/types/errors";

export const fetchEmployeeById = async (employeeId: string): Promise<ApiResponse<Employee>> => {
  logger.debug("Fetching employee data", { employeeId }, "EmployeeDetailsService");
  
  try {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .single();
      
    if (error) {
      logger.error("Failed to fetch employee", error, "EmployeeDetailsService");
      throw new AppError("EMPLOYEE_FETCH_FAILED", `Failed to fetch employee: ${error.message}`, { employeeId, supabaseError: error });
    }
    
    logger.debug("Employee data retrieved successfully", { employeeId }, "EmployeeDetailsService");
    return createServiceResponse(data as unknown as Employee);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error("Unexpected error fetching employee", error, "EmployeeDetailsService");
    throw new AppError("EMPLOYEE_FETCH_UNEXPECTED", "Unexpected error occurred while fetching employee", { employeeId, error });
  }
};

export const updateEmployeeFieldById = async (
  employeeId: string, 
  fieldName: string, 
  value: unknown
): Promise<ApiResponse<boolean>> => {
  logger.debug("Updating employee field", { employeeId, fieldName }, "EmployeeDetailsService");
  
  try {
    const { error } = await supabase
      .from("employees")
      .update({ [fieldName]: value })
      .eq("id", employeeId);
    
    if (error) {
      logger.error("Failed to update employee field", error, "EmployeeDetailsService");
      throw new AppError("EMPLOYEE_UPDATE_FAILED", `Failed to update employee field: ${error.message}`, { employeeId, fieldName, supabaseError: error });
    }
    
    logger.info("Employee field updated successfully", { employeeId, fieldName }, "EmployeeDetailsService");
    return createServiceResponse(true);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error("Unexpected error updating employee field", error, "EmployeeDetailsService");
    throw new AppError("EMPLOYEE_UPDATE_UNEXPECTED", "Unexpected error occurred while updating employee", { employeeId, fieldName, error });
  }
};

export const deleteEmployeeById = async (employeeId: string): Promise<ApiResponse<void>> => {
  logger.debug("Deleting employee", { employeeId }, "EmployeeDetailsService");
  
  try {
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", employeeId);
    
    if (error) {
      logger.error("Failed to delete employee", error, "EmployeeDetailsService");
      throw new AppError("EMPLOYEE_DELETE_FAILED", `Failed to delete employee: ${error.message}`, { employeeId, supabaseError: error });
    }
    
    logger.info("Employee deleted successfully", { employeeId }, "EmployeeDetailsService");
    return createServiceResponse(null);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error("Unexpected error deleting employee", error, "EmployeeDetailsService");
    throw new AppError("EMPLOYEE_DELETE_UNEXPECTED", "Unexpected error occurred while deleting employee", { employeeId, error });
  }
};

export const fetchEmployeeWithNavigation = async (employeeId: string): Promise<ApiResponse<{
  employee: Employee;
  nextEmployeeId: string | null;
  prevEmployeeId: string | null;
}>> => {
  logger.debug("Fetching employee with navigation", { employeeId }, "EmployeeDetailsService");
  
  try {
    const employeeResponse = await fetchEmployeeById(employeeId);
    if (!employeeResponse.success || !employeeResponse.data) {
      throw new AppError("EMPLOYEE_NOT_FOUND", "Employee not found for navigation", { employeeId });
    }
    
    const employee = employeeResponse.data;
    const { nextEmployeeId, prevEmployeeId } = await fetchAdjacentEmployees(
      employee.last_name,
      employee.first_name,
      employee.id
    );
    
    return createServiceResponse({ employee, nextEmployeeId, prevEmployeeId });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error("Unexpected error fetching employee with navigation", error, "EmployeeDetailsService");
    throw new AppError("EMPLOYEE_NAVIGATION_UNEXPECTED", "Unexpected error occurred while fetching employee navigation", { employeeId, error });
  }
};

