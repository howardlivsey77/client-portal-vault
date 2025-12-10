import { supabase } from "@/integrations/supabase/client";
import { Employee, AppError, createServiceResponse, ApiResponse, EMPLOYEE_EDITABLE_FIELDS } from "@/types";
import { fetchAdjacentEmployees } from "./employeeNavigationService";
import { logger } from "@/services/common/loggingService";

export const fetchEmployeeByIdDetails = async (employeeId: string): Promise<ApiResponse<Employee>> => {
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
  value: unknown,
  isAdmin: boolean = false,
  isOwnRecord: boolean = false
): Promise<ApiResponse<boolean>> => {
  logger.debug("Updating employee field", { employeeId, fieldName, isAdmin, isOwnRecord }, "EmployeeDetailsService");
  
  try {
    // Validate field access for non-admins
    if (!isAdmin && !EMPLOYEE_EDITABLE_FIELDS.includes(fieldName as any)) {
      logger.warn("Permission denied for field update", { employeeId, fieldName, isAdmin, isOwnRecord }, "EmployeeDetailsService");
      throw new AppError(
        "EMPLOYEE_UPDATE_FORBIDDEN",
        "You do not have permission to update this field",
        { employeeId, fieldName }
      );
    }
    
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
  logger.debug("Deleting employee and related records", { employeeId }, "EmployeeDetailsService");
  
  try {
    // Delete related records in correct order (child tables first)
    
    // 1. Delete work patterns
    const { error: workPatternsError } = await supabase
      .from("work_patterns")
      .delete()
      .eq("employee_id", employeeId);
    if (workPatternsError) {
      logger.error("Failed to delete work patterns", workPatternsError, "EmployeeDetailsService");
      throw new AppError("EMPLOYEE_DELETE_FAILED", `Failed to delete work patterns: ${workPatternsError.message}`, { employeeId });
    }

    // 2. Delete sickness entitlement usage
    const { error: entitlementError } = await supabase
      .from("employee_sickness_entitlement_usage")
      .delete()
      .eq("employee_id", employeeId);
    if (entitlementError) {
      logger.error("Failed to delete sickness entitlement usage", entitlementError, "EmployeeDetailsService");
      throw new AppError("EMPLOYEE_DELETE_FAILED", `Failed to delete sickness entitlement: ${entitlementError.message}`, { employeeId });
    }

    // 3. Delete sickness historical balances
    const { error: historicalError } = await supabase
      .from("employee_sickness_historical_balances")
      .delete()
      .eq("employee_id", employeeId);
    if (historicalError) {
      logger.error("Failed to delete sickness historical balances", historicalError, "EmployeeDetailsService");
      throw new AppError("EMPLOYEE_DELETE_FAILED", `Failed to delete historical balances: ${historicalError.message}`, { employeeId });
    }

    // 4. Delete sickness records
    const { error: sicknessError } = await supabase
      .from("employee_sickness_records")
      .delete()
      .eq("employee_id", employeeId);
    if (sicknessError) {
      logger.error("Failed to delete sickness records", sicknessError, "EmployeeDetailsService");
      throw new AppError("EMPLOYEE_DELETE_FAILED", `Failed to delete sickness records: ${sicknessError.message}`, { employeeId });
    }

    // 5. Delete timesheet entries
    const { error: timesheetError } = await supabase
      .from("timesheet_entries")
      .delete()
      .eq("employee_id", employeeId);
    if (timesheetError) {
      logger.error("Failed to delete timesheet entries", timesheetError, "EmployeeDetailsService");
      throw new AppError("EMPLOYEE_DELETE_FAILED", `Failed to delete timesheet entries: ${timesheetError.message}`, { employeeId });
    }

    // 6. Delete payroll results
    const { error: payrollError } = await supabase
      .from("payroll_results")
      .delete()
      .eq("employee_id", employeeId);
    if (payrollError) {
      logger.error("Failed to delete payroll results", payrollError, "EmployeeDetailsService");
      throw new AppError("EMPLOYEE_DELETE_FAILED", `Failed to delete payroll results: ${payrollError.message}`, { employeeId });
    }

    // 7. Finally delete the employee
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", employeeId);
    
    if (error) {
      logger.error("Failed to delete employee", error, "EmployeeDetailsService");
      throw new AppError("EMPLOYEE_DELETE_FAILED", `Failed to delete employee: ${error.message}`, { employeeId, supabaseError: error });
    }
    
    logger.info("Employee and related records deleted successfully", { employeeId }, "EmployeeDetailsService");
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
    const employeeResponse = await fetchEmployeeByIdDetails(employeeId);
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
