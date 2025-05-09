
import { roundToTwoDecimals } from "@/lib/formatters";
import { calculateIncomeTaxSync, calculateMonthlyIncomeTaxSync } from "./income-tax-sync";
import { getTaxBands } from "./tax-bands-service";

/**
 * Calculate income tax based on annual salary, tax code, and region
 * Asynchronous version that fetches up-to-date tax bands from the database
 */
export async function calculateIncomeTax(
  annualSalary: number, 
  taxCode: string, 
  region: string = 'UK'
): Promise<number> {
  try {
    // Get tax constants from database via the tax-bands-service
    const taxBands = await getTaxBands(region);
    
    // For now, use the sync calculator but with dynamically fetched bands
    // We could create a more advanced TaxCalculator integration in the future
    if (region === 'Scotland') {
      // Calculate Scottish tax
      const taxableAmount = annualSalary;
      let totalTax = 0;
      
      if (taxableAmount > (taxBands.PERSONAL_ALLOWANCE?.threshold || 12570)) {
        // Apply personal allowance
        totalTax += Math.max(0, 
          (taxBands.STARTER_RATE?.threshold || 14732) - (taxBands.PERSONAL_ALLOWANCE?.threshold || 12570)
        ) * (taxBands.STARTER_RATE?.rate || 0.19);
        
        // Apply basic rate
        totalTax += Math.max(0,
          Math.min(taxableAmount, (taxBands.INTERMEDIATE_RATE?.threshold || 25688)) - 
          (taxBands.STARTER_RATE?.threshold || 14732)
        ) * (taxBands.BASIC_RATE?.rate || 0.20);
        
        // Apply intermediate rate
        totalTax += Math.max(0,
          Math.min(taxableAmount, (taxBands.HIGHER_RATE?.threshold || 43662)) - 
          (taxBands.INTERMEDIATE_RATE?.threshold || 25688)
        ) * (taxBands.INTERMEDIATE_RATE?.rate || 0.21);
        
        // Apply higher rate
        totalTax += Math.max(0,
          Math.min(taxableAmount, (taxBands.ADDITIONAL_RATE?.threshold || 150000)) - 
          (taxBands.HIGHER_RATE?.threshold || 43662)
        ) * (taxBands.HIGHER_RATE?.rate || 0.41);
        
        // Apply additional rate
        totalTax += Math.max(0,
          taxableAmount - (taxBands.ADDITIONAL_RATE?.threshold || 150000)
        ) * (taxBands.ADDITIONAL_RATE?.rate || 0.46);
      }
      
      return roundToTwoDecimals(totalTax);
    } else {
      // Use standard UK tax calculation with dynamic bands
      const taxableAmount = annualSalary;
      let totalTax = 0;
      
      if (taxableAmount > (taxBands.PERSONAL_ALLOWANCE?.threshold || 12570)) {
        // Apply basic rate
        totalTax += Math.max(0,
          Math.min(taxableAmount, (taxBands.HIGHER_RATE?.threshold || 50270)) - 
          (taxBands.PERSONAL_ALLOWANCE?.threshold || 12570)
        ) * (taxBands.BASIC_RATE?.rate || 0.20);
        
        // Apply higher rate
        totalTax += Math.max(0,
          Math.min(taxableAmount, (taxBands.ADDITIONAL_RATE?.threshold || 150000)) - 
          (taxBands.HIGHER_RATE?.threshold || 50270)
        ) * (taxBands.HIGHER_RATE?.rate || 0.40);
        
        // Apply additional rate
        totalTax += Math.max(0,
          taxableAmount - (taxBands.ADDITIONAL_RATE?.threshold || 150000)
        ) * (taxBands.ADDITIONAL_RATE?.rate || 0.45);
      }
      
      return roundToTwoDecimals(totalTax);
    }
  } catch (error) {
    console.error("Error calculating income tax with advanced calculator:", error);
    // Fallback to original calculation method
    return calculateIncomeTaxSync(annualSalary, taxCode, region);
  }
}

/**
 * Calculate monthly income tax asynchronously
 * Fetches up-to-date tax bands from the database
 */
export async function calculateMonthlyIncomeTax(
  monthlySalary: number, 
  taxCode: string, 
  region: string = 'UK'
): Promise<number> {
  // For monthly calculation, we'll use the month to determine the proportion of allowance
  try {
    // Calculate annual equivalent and then divide by 12
    const annualSalary = monthlySalary * 12;
    const annualTax = await calculateIncomeTax(annualSalary, taxCode, region);
    return roundToTwoDecimals(annualTax / 12);
  } catch (error) {
    console.error("Error calculating monthly income tax with advanced calculator:", error);
    // Fallback to original calculation method
    const annualSalary = monthlySalary * 12;
    return roundToTwoDecimals(calculateIncomeTaxSync(annualSalary, taxCode, region) / 12);
  }
}
