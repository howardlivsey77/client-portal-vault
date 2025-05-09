
import { getTaxConstantsByCategory, getHardcodedTaxBands } from "../utils/tax-constants-service";
import { TaxBandCollection } from "./income-tax-types";

/**
 * Fetches tax bands from the database or falls back to hardcoded values
 */
export async function getTaxBands(region: string = 'UK'): Promise<TaxBandCollection> {
  try {
    const constants = await getTaxConstantsByCategory('TAX_BANDS', region);
    
    // Initialize tax bands object
    const taxBands: TaxBandCollection = {};
    
    // For Scotland, we have different tax band names and structure
    if (region === 'Scotland') {
      // Tax band names for Scotland
      const taxBandNames = [
        'PERSONAL_ALLOWANCE', 'STARTER_RATE', 'BASIC_RATE', 
        'INTERMEDIATE_RATE', 'HIGHER_RATE', 'ADDITIONAL_RATE'
      ];
      
      // Process each tax band
      taxBandNames.forEach(bandName => {
        const thresholdConstant = constants.find(c => c.key === `${bandName}_THRESHOLD`);
        const rateConstant = constants.find(c => c.key === `${bandName}_RATE`);
        
        if (thresholdConstant?.value_numeric !== null || rateConstant?.value_numeric !== null) {
          taxBands[bandName] = {
            threshold: thresholdConstant?.value_numeric ?? (bandName === 'ADDITIONAL_RATE' ? Infinity : 0),
            rate: rateConstant?.value_numeric ?? 0
          };
        }
      });
    } else {
      // Standard UK/Wales tax band names
      const taxBandNames = ['PERSONAL_ALLOWANCE', 'BASIC_RATE', 'HIGHER_RATE', 'ADDITIONAL_RATE'];
      
      // Process each tax band
      taxBandNames.forEach(bandName => {
        const thresholdConstant = constants.find(c => c.key === `${bandName}_THRESHOLD`);
        const rateConstant = constants.find(c => c.key === `${bandName}_RATE`);
        
        if (thresholdConstant?.value_numeric !== null || rateConstant?.value_numeric !== null) {
          taxBands[bandName] = {
            threshold: thresholdConstant?.value_numeric ?? (bandName === 'ADDITIONAL_RATE' ? Infinity : 0),
            rate: rateConstant?.value_numeric ?? 0
          };
        }
      });
    }
    
    // If we didn't get all the bands, use the hardcoded ones
    if (Object.keys(taxBands).length < 4) { // At least 4 bands expected
      return getHardcodedTaxBands(region);
    }
    
    // Make sure ADDITIONAL_RATE has Infinity threshold if not specified
    if (taxBands['ADDITIONAL_RATE'] && taxBands['ADDITIONAL_RATE'].threshold === 0) {
      taxBands['ADDITIONAL_RATE'].threshold = Infinity;
    }
    
    return taxBands;
  } catch (error) {
    console.error(`Error fetching tax bands for region ${region}:`, error);
    return getHardcodedTaxBands(region);
  }
}
