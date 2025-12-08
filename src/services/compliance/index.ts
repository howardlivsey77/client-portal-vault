export { AuditLoggingService } from "./audit/auditLoggingService";
export type { AuditEventType, SensitiveDataType, AuditLogEntry, DataAccessPattern } from "./audit/auditLoggingService";

export { DataExportService } from "./privacy/dataExportService";
export { DataRetentionService, RetentionPolicyType } from "./privacy/dataRetentionService";
export { RightToErasureService, ErasureRequestStatus, ErasureMethod } from "./privacy/rightToErasureService";

// Re-export from original compliance folder
export { ComplianceMonitoringService } from "./complianceMonitoringService";
