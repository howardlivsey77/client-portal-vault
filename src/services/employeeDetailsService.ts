// Backwards-compatible re-exports - using renamed export to avoid conflict
export { 
  fetchEmployeeByIdDetails as fetchEmployeeById,
  updateEmployeeFieldById,
  deleteEmployeeById,
  fetchEmployeeWithNavigation
} from "./employees/employeeDetailsService";
