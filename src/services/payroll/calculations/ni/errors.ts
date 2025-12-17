/**
 * Custom errors for National Insurance calculations
 */

export class NICalculationIntegrityError extends Error {
  constructor(
    message: string,
    public readonly context: Record<string, unknown>
  ) {
    super(message);
    this.name = 'NICalculationIntegrityError';
  }
}
