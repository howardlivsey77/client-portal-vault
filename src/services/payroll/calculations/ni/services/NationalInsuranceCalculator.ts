
/**
 * NI Calculator Service 
 * Provides an organized interface for National Insurance calculations
 * with secure logging (no PII) and validation
 */

import { roundToTwoDecimals } from "@/lib/formatters";
import { NICBand, NICalculationResult } from "../types";
import { fetchNIBands } from "../database";
import { calculateFromBands, calculateNationalInsuranceFallback } from "../calculation-utils";
import { payrollLogger } from "@/services/payroll/utils/payrollLogger";

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
      payrollLogger.debug(`Initialized NI calculator for tax year ${taxYear}`, { taxYear }, 'NI_CALC');
    }
  }
  
  /**
   * Log a message if debug mode is enabled
   */
  private log(message: string, data?: Record<string, unknown>): void {
    if (this.debugMode) {
      payrollLogger.debug(message, data, 'NI_CALC');
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
    
    // Validate 2025/26 LEL value (£542/month)
    const expectedLEL2025 = 542;
    if (result.earningsAtLEL > 0 && result.earningsAtLEL !== expectedLEL2025) {
      this.log(`LEL validation: expected £${expectedLEL2025}, got £${result.earningsAtLEL}`, {
        expected: expectedLEL2025,
        actual: result.earningsAtLEL
      });
    }
    
    // Check for potential calculation errors
    if (result.nationalInsurance === 0 && 
        (result.earningsPTtoUEL > 0 || result.earningsAboveUEL > 0)) {
      this.log(`Zero NI despite earnings above PT - possible calculation error`, {
        earningsPTtoUEL: result.earningsPTtoUEL,
        earningsAboveUEL: result.earningsAboveUEL
      });
      
      // Force recalculation in situations where NI should not be zero
      if (result.earningsPTtoUEL > 0 && result.earningsPTtoUEL > 10) {
        // Apply typical 12% rate for PT to UEL earnings as fallback
        result.nationalInsurance += roundToTwoDecimals(result.earningsPTtoUEL * 0.12);
      }
      
      if (result.earningsAboveUEL > 0) {
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
    this.log(`Calculating NI for monthly salary`, { monthlySalary });
    
    try {
      // Fetch NI bands from the database
      const niBands = await fetchNIBands(this.taxYear);
      
      // Enhanced logging for calculation path
      this.log(`Using ${niBands && niBands.length > 0 ? 'DATABASE' : 'FALLBACK'} calculation path`, {
        bandsCount: niBands?.length || 0
      });
      
      // If we successfully got bands from database, use those
      if (niBands && niBands.length > 0) {
        this.log(`Using NI bands from database`, { bandsCount: niBands.length });
        
        // For debugging, check if we have all the required bands
        if (this.debugMode) {
          const employeeBands = niBands.filter(band => band.contribution_type === 'Employee');
          
          // Verify we have all necessary bands
          const hasLEL = employeeBands.some(band => band.name.includes('LEL') && !band.name.includes('to'));
          const hasLELtoPT = employeeBands.some(band => band.name.includes('LEL to PT'));
          const hasPTtoUEL = employeeBands.some(band => band.name.includes('PT to UEL'));
          const hasAboveUEL = employeeBands.some(band => band.name.includes('Above UEL'));
          
          this.log(`Band check`, { hasLEL, hasLELtoPT, hasPTtoUEL, hasAboveUEL });
        }
        
        const result = calculateFromBands(monthlySalary, niBands);
        
        if (result) {
          // Validate and log the calculation result
          const validatedResult = this.validateResult(result);
          
          this.log(`DATABASE calculation successful`, { 
            nationalInsurance: validatedResult.nationalInsurance 
          });
          
          return validatedResult;
        }
      }
      
      this.log(`No valid NI bands from database, using FALLBACK calculation`);
      return this.calculateWithFallback(monthlySalary);
    } catch (error) {
      payrollLogger.error(`Error in NI calculation`, error, 'NI_CALC');
      return this.calculateWithFallback(monthlySalary);
    }
  }
  
  /**
   * Calculate NI using fallback constants-based approach
   */
  private calculateWithFallback(monthlySalary: number): NICalculationResult {
    this.log(`Using FALLBACK NI calculation`, { monthlySalary });
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
