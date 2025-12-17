/**
 * Payroll Logger Service
 * 
 * Provides secure logging for payroll operations:
 * - No PII (employee names, addresses, NI numbers) logged
 * - No monetary amounts logged (data minimization)
 * - Only logs in development mode by default
 * - Uses anonymized employee IDs for debugging
 * - Structured logs with payroll-specific context
 * 
 * DATA MINIMIZATION PRINCIPLE:
 * Payroll logs should contain identifiers and states, NOT amounts.
 * Monetary values should only appear in trace-level logs if at all,
 * as payroll logs are often exported for support/analytics.
 */

import { logger } from "@/services/common/loggingService";

type PayrollLogContext = 'PAYROLL' | 'NI_CALC' | 'TAX_CALC' | 'DATABASE' | 'PENSION';

interface PayrollLogData {
  employeeId?: string;
  [key: string]: unknown;
}

/**
 * Fields that should NEVER be logged
 * - PII fields: names, addresses, NI numbers
 * - Monetary fields: salaries, payments, deductions (data minimization)
 */
const SENSITIVE_FIELDS = [
  // PII fields
  'employeeName', 
  'nationalInsuranceNumber', 
  'address', 
  'address1', 
  'address2', 
  'address3', 
  'address4',
  'postcode',
  'email',
  'dateOfBirth',
  // Monetary fields (data minimization)
  'monthlySalary',
  'grossPay',
  'netPay',
  'incomeTax',
  'nationalInsurance',
  'pensionContribution',
  'studentLoan',
  'salary',
  'pay',
  'earnings',
  'deductions',
  'amount'
];

/**
 * Sanitize payroll data to remove PII and monetary values before logging
 * - Removes: employeeName, nationalInsuranceNumber, address fields
 * - Removes: All monetary values (data minimization)
 * - Keeps: employeeId (truncated), tax codes, plan types, flags
 */
function sanitizePayrollData(data?: PayrollLogData): Record<string, unknown> | undefined {
  if (!data) return undefined;
  
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip sensitive fields
    if (SENSITIVE_FIELDS.includes(key)) continue;
    
    // Skip any field ending with common monetary suffixes
    if (key.endsWith('Pay') || key.endsWith('Tax') || key.endsWith('Salary') || 
        key.endsWith('Amount') || key.endsWith('Contribution') || key.endsWith('Earnings')) {
      continue;
    }
    
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
 * Payroll logger with built-in PII and data minimization protection
 */
export const payrollLogger = {
  /**
   * Debug level log - only in development
   * Note: Monetary values are automatically stripped
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
   * Log calculation step - DEVELOPMENT ONLY
   * 
   * WARNING: This logs numeric values and should ONLY be used during
   * active debugging in development. Values are logged but context
   * helps identify what's being calculated without exposing whose data it is.
   * 
   * @param step - Description of the calculation step
   * @param values - Numeric values (these ARE logged - use sparingly)
   * @param context - Log context category
   */
  calculation: (step: string, values: Record<string, number>, context: PayrollLogContext = 'PAYROLL'): void => {
    // Only log in development - calculation values should not reach production logs
    if (import.meta.env.DEV) {
      logger.debug(`Calculation: ${step}`, values, context);
    }
  }
};
