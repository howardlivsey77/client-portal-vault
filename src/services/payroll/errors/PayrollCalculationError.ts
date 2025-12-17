/**
 * Custom error class for payroll calculation failures
 * 
 * Provides structured error handling with:
 * - Specific error codes for different failure types
 * - Original cause preservation
 * - Context data for debugging (without PII)
 */

export type PayrollErrorCode = 
  | 'INCOME_TAX_FAILED'
  | 'NI_CALCULATION_FAILED'
  | 'NHS_PENSION_FAILED'
  | 'STUDENT_LOAN_FAILED'
  | 'DATABASE_LOOKUP_FAILED'
  | 'INVALID_INPUT';

export class PayrollCalculationError extends Error {
  public readonly code: PayrollErrorCode;
  public readonly cause?: Error;
  public readonly context?: Record<string, unknown>;

  constructor(
    code: PayrollErrorCode,
    message: string,
    cause?: Error,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PayrollCalculationError';
    this.code = code;
    this.cause = cause;
    // Sanitize context to ensure no PII is stored
    this.context = context ? this.sanitizeContext(context) : undefined;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PayrollCalculationError);
    }
  }

  /**
   * Remove any potentially sensitive data from context
   */
  private sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = [
      'employeeName',
      'nationalInsuranceNumber',
      'address',
      'email',
      'dateOfBirth',
      'monthlySalary',
      'grossPay',
      'netPay'
    ];

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(context)) {
      if (!sensitiveKeys.includes(key)) {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Get a user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case 'INCOME_TAX_FAILED':
        return 'Unable to calculate income tax. Please check the tax code and try again.';
      case 'NI_CALCULATION_FAILED':
        return 'Unable to calculate National Insurance contributions.';
      case 'NHS_PENSION_FAILED':
        return 'Unable to calculate NHS pension contributions.';
      case 'STUDENT_LOAN_FAILED':
        return 'Unable to calculate student loan deductions.';
      case 'DATABASE_LOOKUP_FAILED':
        return 'Unable to retrieve tax data. Please try again later.';
      case 'INVALID_INPUT':
        return 'Invalid payroll input data provided.';
      default:
        return 'An error occurred during payroll calculation.';
    }
  }
}
