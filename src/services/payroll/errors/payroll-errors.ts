/**
 * Custom error types for payroll calculations
 * These provide clear, actionable error messages for production debugging
 */

/**
 * Thrown when input validation fails
 */
export class PayrollValidationError extends Error {
  public readonly field: string;
  public readonly value: unknown;
  public readonly constraint: string;

  constructor(field: string, value: unknown, constraint: string) {
    super(`Invalid ${field}: ${constraint}. Received: ${JSON.stringify(value)}`);
    this.name = 'PayrollValidationError';
    this.field = field;
    this.value = value;
    this.constraint = constraint;
  }
}

/**
 * Thrown when a tax code cannot be parsed or is not recognized
 */
export class UnrecognizedTaxCodeError extends Error {
  public readonly taxCode: string;

  constructor(taxCode: string) {
    super(
      `Unrecognized tax code: "${taxCode}". ` +
      `Valid formats: numeric+suffix (1257L, 45M, 1000N, 500T), ` +
      `K codes (K497), special codes (BR, D0, D1, NT, 0T). ` +
      `Cannot proceed with calculation - manual review required.`
    );
    this.name = 'UnrecognizedTaxCodeError';
    this.taxCode = taxCode;
  }
}

/**
 * Thrown when calculation produces anomalous results
 */
export class CalculationAnomalyError extends Error {
  public readonly details: Record<string, unknown>;

  constructor(message: string, details: Record<string, unknown>) {
    super(`Calculation anomaly: ${message}`);
    this.name = 'CalculationAnomalyError';
    this.details = details;
  }
}

/**
 * Thrown when Scottish/Welsh tax codes are used but not yet supported
 */
export class UnsupportedTaxRegionError extends Error {
  public readonly region: 'Scotland' | 'Wales';
  public readonly taxCode: string;

  constructor(taxCode: string, region: 'Scotland' | 'Wales') {
    super(
      `${region} tax code "${taxCode}" detected. ` +
      `${region} has different tax bands which are not yet implemented. ` +
      `Please use English tax code format or contact support.`
    );
    this.name = 'UnsupportedTaxRegionError';
    this.taxCode = taxCode;
    this.region = region;
  }
}
