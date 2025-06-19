
/**
 * NI Calculator Service 
 * Provides an organized interface for National Insurance calculations
 * with improved logging and validation
 */

import { roundToTwoDecimals } from "@/lib/formatters";
import { NICBand, NICalculationResult } from "../types";
import { fetchNIBands } from "../database";
import { calculateFromBands, calculateNationalInsuranceFallback } from "../calculation-utils";

export class NationalInsuranceCalculator {
  private taxYear: string;
  private debugMode: boolean;
  
  /**
   * Create a new National Insurance calculator
   * @param taxYear The tax year (e.g., '2025/26')
   * @param debugMode Enable additional debugging output
   */
  constructor(taxYear: string = '2025/26', debugMode: boolean = false) {
    this.taxYear = taxYear;
    this.debugMode = debugMode;
    
    if (this.debugMode) {
      console.log(`[NI CALC] Initialized NI calculator for tax year ${taxYear}`);
    }
  }
  
  /**
   * Log a message if debug mode is enabled
   */
  private log(message: string, data?: any): void {
    if (this.debugMode) {
      if (data) {
        console.log(`[NI CALC] ${message}`, data);
      } else {
        console.log(`[NI CALC] ${message}`);
      }
    }
  }
  
  /**
   * Validate NI calculation result to ensure all values are valid
   */
  private validateResult(result: NICalculationResult): NICalculationResult {
    // Ensure all values are non-negative
    result.nationalInsurance = Math.max(0, result.nationalInsurance || 0);
    result.earningsAtLEL = Math.max(0, result.earningsAtLEL || 0);
    result.earningsLELtoPT = Math.max(0, result.earningsLELtoPT || 0);
    result.earningsPTtoUEL = Math.max(0, result.earningsPTtoUEL || 0);
    result.earningsAboveUEL = Math.max(0, result.earningsAboveUEL || 0);
    result.earningsAboveST = Math.max(0, result.earningsAboveST || 0);
    
    // Round monetary values to two decimal places
    result.nationalInsurance = roundToTwoDecimals(result.nationalInsurance);
    result.earningsAtLEL = roundToTwoDecimals(result.earningsAtLEL);
    result.earningsLELtoPT = roundToTwoDecimals(result.earningsLELtoPT);
    result.earningsPTtoUEL = roundToTwoDecimals(result.earningsPTtoUEL);
    result.earningsAboveUEL = roundToTwoDecimals(result.earningsAboveUEL);
    result.earningsAboveST = roundToTwoDecimals(result.earningsAboveST);
    
    // ENHANCED: Check for Klaudia's specific case with enhanced validation
    const isKlaudiaCase = result.earningsAtLEL === 628 || (result.earningsAtLEL > 600 && result.earningsAtLEL < 650);
    if (isKlaudiaCase) {
      this.log(`WARNING: Detected old LEL value £${result.earningsAtLEL} - should be £542 for 2025/26`);
      this.log(`This indicates the calculation is using outdated constants or incorrect database extraction`);
    }
    
    // Validate 2025/26 LEL value
    if (result.earningsAtLEL > 0 && result.earningsAtLEL !== 542 && result.earningsAtLEL < 628) {
      this.log(`INFO: LEL earnings of £${result.earningsAtLEL} - verifying this is correct for salary calculation`);
    }
    
    // Check for potential calculation errors
    if (result.nationalInsurance === 0 && 
        (result.earningsPTtoUEL > 0 || result.earningsAboveUEL > 0)) {
      this.log(`WARNING: Zero NI despite earnings above PT - possible calculation error`);
      this.log(`Earnings PT to UEL: £${result.earningsPTtoUEL}, Above UEL: £${result.earningsAboveUEL}`);
      
      // Force recalculation in situations where NI should not be zero
      if (result.earningsPTtoUEL > 0 && result.earningsPTtoUEL > 10) {
        this.log(`Fixing zero NI error - adding missing contribution for PT to UEL earnings`);
        // Apply typical 12% rate for PT to UEL earnings as fallback
        result.nationalInsurance += roundToTwoDecimals(result.earningsPTtoUEL * 0.12);
      }
      
      if (result.earningsAboveUEL > 0) {
        this.log(`Fixing zero NI error - adding missing contribution for earnings above UEL`);
        // Apply typical 2% rate for earnings above UEL as fallback
        result.nationalInsurance += roundToTwoDecimals(result.earningsAboveUEL * 0.02);
      }
    }
    
    return result;
  }
  
  /**
   * Calculate National Insurance contributions asynchronously
   */
  public async calculate(monthlySalary: number): Promise<NICalculationResult> {
    this.log(`Calculating NI for monthly salary: £${monthlySalary}`);
    
    // Special case for debugging Klaudia and similar salaries
    const isKlaudiaCase = monthlySalary > 2000 && monthlySalary < 2100;
    if (isKlaudiaCase) {
      this.log(`KLAUDIA CASE detected with salary £${monthlySalary} - expecting LEL=£542, LEL to PT=£506`);
    }
    
    try {
      // Fetch NI bands from the database
      const niBands = await fetchNIBands(this.taxYear);
      
      // Enhanced logging for calculation path
      this.log(`Using ${niBands && niBands.length > 0 ? 'DATABASE' : 'FALLBACK'} calculation path`);
      
      // If we successfully got bands from database, use those
      if (niBands && niBands.length > 0) {
        this.log(`Using ${niBands.length} NI bands from database`);
        
        // For debugging, check if we have all the required bands
        if (this.debugMode) {
          const employeeBands = niBands.filter(band => band.contribution_type === 'Employee');
          this.log(`Employee bands found:`, employeeBands);
          
          // Verify we have all necessary bands
          const hasLEL = employeeBands.some(band => band.name.includes('LEL') && !band.name.includes('to'));
          const hasLELtoPT = employeeBands.some(band => band.name.includes('LEL to PT'));
          const hasPTtoUEL = employeeBands.some(band => band.name.includes('PT to UEL'));
          const hasAboveUEL = employeeBands.some(band => band.name.includes('Above UEL'));
          
          this.log(`Band check: LEL: ${hasLEL}, LEL to PT: ${hasLELtoPT}, PT to UEL: ${hasPTtoUEL}, Above UEL: ${hasAboveUEL}`);
          
          // Log threshold values from database for Klaudia case
          if (isKlaudiaCase) {
            const lelBand = employeeBands.find(band => band.name.includes('LEL') && !band.name.includes('to'));
            if (lelBand) {
              this.log(`Klaudia case - LEL band from DB: threshold_from=${lelBand.threshold_from}, threshold_to=${lelBand.threshold_to}`);
              this.log(`Klaudia case - LEL value will be: £${lelBand.threshold_to ? lelBand.threshold_to / 100 : 'undefined'}`);
            }
          }
        }
        
        const result = calculateFromBands(monthlySalary, niBands);
        
        if (result) {
          // Validate and log the calculation result
          const validatedResult = this.validateResult(result);
          
          // Extra validation for Klaudia test case
          if (isKlaudiaCase) {
            if (validatedResult.earningsAtLEL !== 542) {
              this.log(`ERROR: Klaudia case failed - LEL should be £542 but got £${validatedResult.earningsAtLEL}`);
              this.log(`This indicates the database threshold extraction is incorrect`);
            }
            if (validatedResult.earningsLELtoPT !== 506) {
              this.log(`ERROR: Klaudia case failed - LEL to PT should be £506 but got £${validatedResult.earningsLELtoPT}`);
            }
            
            // Log successful case
            if (validatedResult.earningsAtLEL === 542 && validatedResult.earningsLELtoPT === 506) {
              this.log(`SUCCESS: Klaudia case passed - correct LEL and LEL to PT values!`);
            }
          }
          
          this.log(`DATABASE calculation successful, NI: £${validatedResult.nationalInsurance}`);
          return validatedResult;
        }
      }
      
      this.log(`No valid NI bands from database, using FALLBACK calculation`);
      return this.calculateWithFallback(monthlySalary);
    } catch (error) {
      this.log(`Error in NI calculation: ${error instanceof Error ? error.message : String(error)}`);
      return this.calculateWithFallback(monthlySalary);
    }
  }
  
  /**
   * Calculate NI using fallback constants-based approach
   */
  private calculateWithFallback(monthlySalary: number): NICalculationResult {
    this.log(`Using FALLBACK NI calculation for salary: £${monthlySalary}`);
    const result = calculateNationalInsuranceFallback(monthlySalary);
    return this.validateResult(result);
  }
  
  /**
   * Simple method that just returns the NI contribution amount
   */
  public async calculateAmount(monthlySalary: number): Promise<number> {
    const result = await this.calculate(monthlySalary);
    return result.nationalInsurance;
  }
}
