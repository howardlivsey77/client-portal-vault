// Core employee services
export { fetchEmployeeById, createEmployee, updateEmployee } from "./employeeService";
export { fetchAdjacentEmployees } from "./employeeNavigationService";
export { 
  fetchEmployeeByIdDetails, 
  updateEmployeeFieldById, 
  deleteEmployeeById, 
  fetchEmployeeWithNavigation 
} from "./employeeDetailsService";

// Department services
export {
  fetchDepartmentsByCompany,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentNames
} from "./departmentService";
export type { Department, CreateDepartmentData, UpdateDepartmentData } from "./departmentService";

// Timesheet services
export {
  fetchTimesheetSettings,
  fetchTimesheetEntries,
  saveTimesheetEntries,
  syncTimesheetPayrollIds
} from "./timesheetService";
