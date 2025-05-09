
/**
 * Main income tax calculation module
 * Re-exports functionality from specialized modules
 */

// Export async tax calculation methods
export { calculateIncomeTax } from "./income-tax-async";

// Export sync tax calculation methods
export { 
  calculateIncomeTaxSync, 
  calculateMonthlyIncomeTaxSync 
} from "./income-tax-sync";

// Export tax band services
export { getTaxBands } from "./tax-bands-service";

// Export types properly using 'export type'
export type { TaxBand, TaxBandCollection, TaxCalculatorOptions } from "./income-tax-types";
