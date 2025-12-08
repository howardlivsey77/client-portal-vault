// Backwards-compatible re-exports
export {
  fetchDepartmentsByCompany,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentNames
} from "./employees/departmentService";
export type { Department, CreateDepartmentData, UpdateDepartmentData } from "./employees/departmentService";
