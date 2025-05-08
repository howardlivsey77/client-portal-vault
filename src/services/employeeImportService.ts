
// This file now just re-exports from the modules for backward compatibility
export { 
  executeImport,
  findExistingEmployees,
  checkDuplicatePayrollIds,
  createNewEmployees, 
  updateExistingEmployees,
} from "./employeeImport";

// Use 'export type' when re-exporting types with isolatedModules enabled
export type { ImportResult } from "./employeeImport";
