
/**
 * Common types for income tax calculations
 */

export interface TaxBand {
  threshold: number;
  rate: number;
}

export interface TaxBandCollection {
  [key: string]: TaxBand;
}

export interface TaxCalculatorOptions {
  annualSalary?: number;
  monthlySalary?: number;
  taxCode: string;
  region?: string;
}
