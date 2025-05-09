
/**
 * Main income tax calculation module
 * Re-exports functionality from specialized modules
 */

// Export async tax calculation methods
export { calculateIncomeTax, calculateMonthlyIncomeTax } from "./income-tax-async";

// Export sync tax calculation methods
export { 
  calculateIncomeTaxSync, 
  calculateMonthlyIncomeTaxSync 
} from "./income-tax-sync";

// Export UK tax calculator functions
export {
  calculateUKTax,
  calculateMonthlyUKTax
} from "./uk-tax-calculator";

// Export Scottish tax calculator functions
export {
  calculateScottishTax,
  calculateMonthlyScottishTax
} from "./scottish-tax-calculator";

// Export emergency tax calculator functions
export {
  calculateEmergencyTax
} from "./emergency-tax-calculator";

// Export tax band services
export { getTaxBands } from "./tax-bands-service";

// Export types properly using 'export type'
export type { TaxBand, TaxBandCollection, TaxCalculatorOptions } from "./income-tax-types";
