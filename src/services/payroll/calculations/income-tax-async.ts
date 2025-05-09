
import { roundToTwoDecimals } from "@/lib/formatters";
import { TaxCalculator } from "./TaxCalculator";
import { convertTaxConstantsToTaxBands } from "../utils/tax-bands-converter";
import { getTaxConstantsByCategory } from "../utils/tax-constants-service";
import { calculateIncomeTaxSync, calculateMonthlyIncomeTaxSync } from "./income-tax-sync";

/**
 * Calculate income tax based on annual salary, tax code, and region using the advanced TaxCalculator
 * Asynchronous version that fetches up-to-date tax bands from the database
 */
export async function calculateIncomeTax(
  annualSalary: number, 
  taxCode: string, 
  region: string = 'UK'
): Promise<number> {
  try {
    // Get tax constants from database
    const constants = await getTaxConstantsByCategory('TAX_BANDS', region);
    
    // Convert constants to tax bands format
    const taxBands = convertTaxConstantsToTaxBands(constants);
    
    // Create calculator with tax bands
    const calculator = new TaxCalculator({ hmrcTax: taxBands });
    
    // Calculate tax for annual salary
    const result = calculator.calculate({
      taxablePay: annualSalary * 100, // convert to pence
      period: 12, // Annual calculation
      taxCode: taxCode,
      totalPreviousPay: 0,
      totalPreviousTax: 0
    });
    
    return roundToTwoDecimals(result.totalTaxToDate / 100); // convert back to pounds
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
    // Get current month (1-12)
    const currentMonth = new Date().getMonth() + 1;
    
    // Get tax constants from database
    const constants = await getTaxConstantsByCategory('TAX_BANDS', region);
    
    // Convert constants to tax bands format
    const taxBands = convertTaxConstantsToTaxBands(constants);
    
    // Create calculator with tax bands
    const calculator = new TaxCalculator({ hmrcTax: taxBands });
    
    // Calculate tax for monthly salary - assuming this is a standalone month
    const result = calculator.calculate({
      taxablePay: monthlySalary * 100, // convert to pence
      period: 1, // Just for this month
      taxCode: taxCode,
      totalPreviousPay: 0,
      totalPreviousTax: 0
    });
    
    return roundToTwoDecimals(result.taxThisPeriod / 100); // convert back to pounds
  } catch (error) {
    console.error("Error calculating monthly income tax with advanced calculator:", error);
    // Fallback to original calculation method
    const annualSalary = monthlySalary * 12;
    const annualTax = await calculateIncomeTax(annualSalary, taxCode, region);
    return roundToTwoDecimals(annualTax / 12);
  }
}
