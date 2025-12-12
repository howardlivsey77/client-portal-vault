/**
 * Input validation for payroll calculations using Zod
 * Provides strict validation with clear error messages
 */

import { z } from 'zod';

/**
 * Tax code validation schema
 * Accepts: 1257L, 45M, K497, BR, D0, D1, NT, 0T, etc.
 * Rejects: empty, too long, invalid characters
 */
export const TaxCodeSchema = z
  .string({
    required_error: 'Tax code is required',
    invalid_type_error: 'Tax code must be a string',
  })
  .min(1, 'Tax code cannot be empty')
  .max(10, 'Tax code exceeds maximum length (10 characters)')
  .regex(
    /^[A-Za-z0-9]+$/,
    'Tax code contains invalid characters (only letters and numbers allowed)'
  )
  .transform((s) => s.toUpperCase().trim());

/**
 * Gross pay validation schema
 * Must be non-negative, finite number within reasonable bounds
 */
export const GrossPaySchema = z
  .number({
    required_error: 'Gross pay is required',
    invalid_type_error: 'Gross pay must be a number',
  })
  .nonnegative('Gross pay cannot be negative')
  .finite('Gross pay must be a finite number (not NaN or Infinity)')
  .max(10_000_000, 'Gross pay exceeds maximum allowed (£10,000,000)');

/**
 * Tax period validation schema (1-12 for monthly payroll)
 */
export const PeriodSchema = z
  .number({
    required_error: 'Tax period is required',
    invalid_type_error: 'Tax period must be a number',
  })
  .int('Tax period must be a whole number')
  .min(1, 'Tax period must be between 1 and 12')
  .max(12, 'Tax period must be between 1 and 12');

/**
 * Tax paid YTD validation schema
 * Can be negative (refunds) but must be finite
 */
export const TaxPaidYTDSchema = z
  .number({
    required_error: 'Tax paid YTD is required',
    invalid_type_error: 'Tax paid YTD must be a number',
  })
  .finite('Tax paid YTD must be a finite number')
  .refine(
    (val) => val >= -1_000_000 && val <= 10_000_000,
    'Tax paid YTD is outside reasonable bounds (-£1,000,000 to £10,000,000)'
  );

/**
 * Complete payroll input validation for cumulative calculations
 */
export const CumulativePayrollInputSchema = z.object({
  period: PeriodSchema,
  grossPayYTD: GrossPaySchema,
  taxCode: TaxCodeSchema,
  taxPaidYTD: TaxPaidYTDSchema,
});

/**
 * Complete payroll input validation for Week 1/Month 1 calculations
 */
export const Week1Month1PayrollInputSchema = z.object({
  grossPayThisPeriod: GrossPaySchema,
  taxCode: TaxCodeSchema,
});

/**
 * Validation result types
 */
export type CumulativePayrollInput = z.infer<typeof CumulativePayrollInputSchema>;
export type Week1Month1PayrollInput = z.infer<typeof Week1Month1PayrollInputSchema>;

/**
 * Validate cumulative payroll inputs
 * @throws ZodError with detailed field-level errors
 */
export function validateCumulativeInputs(
  period: unknown,
  grossPayYTD: unknown,
  taxCode: unknown,
  taxPaidYTD: unknown
): CumulativePayrollInput {
  return CumulativePayrollInputSchema.parse({
    period,
    grossPayYTD,
    taxCode,
    taxPaidYTD,
  });
}

/**
 * Validate Week 1/Month 1 payroll inputs
 * @throws ZodError with detailed field-level errors
 */
export function validateWeek1Month1Inputs(
  grossPayThisPeriod: unknown,
  taxCode: unknown
): Week1Month1PayrollInput {
  return Week1Month1PayrollInputSchema.parse({
    grossPayThisPeriod,
    taxCode,
  });
}
