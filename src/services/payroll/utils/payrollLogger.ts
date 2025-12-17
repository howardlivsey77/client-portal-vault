/**
 * Payroll Logger Service
 * 
 * Provides secure logging for payroll operations:
 * - No PII (employee names, addresses, NI numbers) logged
 * - Only logs in development mode by default
 * - Uses anonymized employee IDs for debugging
 * - Structured logs with payroll-specific context
 */

import { logger } from "@/services/common/loggingService";

type PayrollLogContext = 'PAYROLL' | 'NI_CALC' | 'TAX_CALC' | 'DATABASE' | 'PENSION';

interface PayrollLogData {
  employeeId?: string;
  [key: string]: unknown;
}

/**
 * Sanitize payroll data to remove PII before logging
 * - Removes: employeeName, nationalInsuranceNumber, address fields
 * - Keeps: employeeId (anonymized reference), numeric values
 */
function sanitizePayrollData(data?: PayrollLogData): Record<string, unknown> | undefined {
  if (!data) return undefined;
  
  const sanitized: Record<string, unknown> = {};
  const piiFields = [
    'employeeName', 
    'nationalInsuranceNumber', 
    'address', 
    'address1', 
    'address2', 
    'address3', 
    'address4',
    'postcode',
    'email',
    'dateOfBirth'
  ];
  
  for (const [key, value] of Object.entries(data)) {
    // Skip PII fields
    if (piiFields.includes(key)) continue;
    
    // Truncate employee ID for privacy (show first 8 chars)
    if (key === 'employeeId' && typeof value === 'string') {
      sanitized[key] = value.substring(0, 8) + '...';
      continue;
    }
    
    sanitized[key] = value;
  }
  
  return sanitized;
}

/**
 * Payroll logger with built-in PII protection
 */
export const payrollLogger = {
  /**
   * Debug level log - only in development
   */
  debug: (message: string, data?: PayrollLogData, context: PayrollLogContext = 'PAYROLL'): void => {
    logger.debug(message, sanitizePayrollData(data), context);
  },
  
  /**
   * Info level log
   */
  info: (message: string, data?: PayrollLogData, context: PayrollLogContext = 'PAYROLL'): void => {
    logger.info(message, sanitizePayrollData(data), context);
  },
  
  /**
   * Warning level log
   */
  warn: (message: string, data?: PayrollLogData, context: PayrollLogContext = 'PAYROLL'): void => {
    logger.warn(message, sanitizePayrollData(data), context);
  },
  
  /**
   * Error level log
   */
  error: (message: string, error?: Error | unknown, context: PayrollLogContext = 'PAYROLL'): void => {
    logger.error(message, error, context);
  },
  
  /**
   * Log calculation step with numeric values only (no PII)
   */
  calculation: (step: string, values: Record<string, number>, context: PayrollLogContext = 'PAYROLL'): void => {
    logger.debug(`Calculation: ${step}`, values, context);
  }
};
