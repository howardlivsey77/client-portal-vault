
// Company types
export type { Company, CompanyWithRole } from './company';

// Document types
export type {
  DatabaseFolder,
  DatabaseDocument,
  DocumentUploadData,
  FileWithPath,
  FolderUploadProgress
} from './documents';

// Employee types
export type { Employee, EmployeeDetailsHookReturn } from './employee-types';
export {
  workDaySchema,
  employeeSchema,
  genderOptions,
  defaultWorkPattern,
  studentLoanPlanOptions,
  nicCodeOptions,
  statusOptions,
  p46StatementOptions
} from './employee';
export type { WorkDay, EmployeeFormValues } from './employee';

// Backward compatibility re-export for employeeDetails
export * from './employeeDetails';

// Employee permissions
export {
  EMPLOYEE_EDITABLE_FIELDS,
  canEmployeeEditField
} from './employee-permissions';
export type { EmployeeEditableField } from './employee-permissions';

// Error types
export type {
  ServiceError,
  DatabaseError,
  ValidationError,
  AuthError,
  ApiResponse
} from './errors';
export { AppError, createServiceResponse } from './errors';

// Sickness types
export type {
  SicknessRecord,
  EntitlementUsage,
  HistoricalBalance,
  SicknessEntitlementSummary
} from './sickness';
