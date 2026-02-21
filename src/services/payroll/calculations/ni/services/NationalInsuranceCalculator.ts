
/**
 * NI Calculator Service 
 * Provides an organized interface for National Insurance calculations
 * with secure logging (no PII) and validation
 */

import { NICalculationResult } from "../types";
import { fetchNIBands } from "../database";
import { calculateFromBands, calculateNationalInsuranceFallback } from "../calculation-utils";
import { payrollLogger } from "@/services/payroll/utils/payrollLogger";
import { getCurrentTaxYear } from "@/services/payroll/utils/taxYearUtils";
import { NICalculationIntegrityError } from "../errors";

export class NationalInsuranceCalculator {
  private taxYear: string;
  private debugMode: boolean;
  
  /**
   * Create a new National Insurance calculator
   * @param taxYear The tax year (e.g., '2025/26') - defaults to current tax year
   * @param debugMode Enable additional debugging output
   */
  constructor(taxYear?: string, debugMode: boolean = false) {
    this.taxYear = taxYear ?? getCurrentTaxYear();
    this.debugMode = debugMode;
    
    if (this.debugMode) {
      payrollLogger.debug(`Initialized NI calculator`, { taxYear: this.taxYear }, 'NI_CALC');
    }
  }
  
  /**
   * Log a message if debug mode is enabled
   * Note: Never log monetary amounts - only flags and counts
   */
  private log(message: string, data?: Record<string, unknown>): void {
    if (this.debugMode) {
      payrollLogger.debug(message, data, 'NI_CALC');
    }
  }
  
  /**
   * Validate and sanitize NI calculation result
   * This method ONLY sanitizes values - it does NOT invent tax liabilities
   * If integrity check fails, throws NICalculationIntegrityError
   */
  private validateResult(result: NICalculationResult): NICalculationResult {
    // Clone to avoid mutation of original object
    const sanitized: NICalculationResult = {
      nationalInsurance: Math.max(0, result.nationalInsurance || 0),
      employerNationalInsurance: Math.max(0, result.employerNationalInsurance || 0),
      earningsAtLEL: Math.max(0, result.earningsAtLEL || 0),
      earningsLELtoPT: Math.max(0, result.earningsLELtoPT || 0),
      earningsPTtoUEL: Math.max(0, result.earningsPTtoUEL || 0),
      earningsAboveUEL: Math.max(0, result.earningsAboveUEL || 0),
      earningsAboveST: Math.max(0, result.earningsAboveST || 0),
    };

    // Threshold of £10 avoids false positives for employees earning just above the
    // Primary Threshold in a given month. Below £10 in the PT-to-UEL band, floating
    // point imprecision could produce a near-zero NI figure that rounds to 0.
    if (sanitized.nationalInsurance === 0 && 
        (sanitized.earningsPTtoUEL > 10 || sanitized.earningsAboveUEL > 0)) {
      throw new NICalculationIntegrityError(
        'Zero NI despite taxable earnings above PT',
        {
          earningsPTtoUEL: sanitized.earningsPTtoUEL,
          earningsAboveUEL: sanitized.earningsAboveUEL
        }
      );
    }
    
    return sanitized;
  }
  
  /**
   * Calculate National Insurance contributions asynchronously
   */
  public async calculate(monthlySalary: number): Promise<NICalculationResult> {
    // Log flag only - never log monetary amounts
    this.log(`Calculating NI`, { hasSalary: monthlySalary > 0 });
    
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
        
        // Best-effort debug check - may not match if DB naming changes
        if (this.debugMode) {
          try {
            const employeeBands = niBands.filter(band => band.contribution_type === 'Employee');
            
            const hasLEL = employeeBands.some(band => 
              band.name?.toLowerCase().includes('lel') && !band.name?.toLowerCase().includes('to')
            );
            const hasLELtoPT = employeeBands.some(band => 
              band.name?.toLowerCase().includes('lel to pt') || band.name?.toLowerCase().includes('lel-pt')
            );
            const hasPTtoUEL = employeeBands.some(band => 
              band.name?.toLowerCase().includes('pt to uel') || band.name?.toLowerCase().includes('pt-uel')
            );
            const hasAboveUEL = employeeBands.some(band => 
              band.name?.toLowerCase().includes('above uel') || band.name?.toLowerCase().includes('uel+')
            );
            
            this.log(`Band check (best-effort)`, { hasLEL, hasLELtoPT, hasPTtoUEL, hasAboveUEL });
          } catch {
            this.log('Band validation skipped - naming mismatch');
          }
        }
        
        const result = calculateFromBands(monthlySalary, niBands);
        
        if (result) {
          try {
            const validatedResult = this.validateResult(result);
            this.log(`DATABASE calculation successful`);
            return validatedResult;
          } catch (error) {
            if (error instanceof NICalculationIntegrityError) {
              payrollLogger.warn(
                `NI integrity check failed, using fallback calculation`,
                { reason: error.message },
                'NI_CALC'
              );
              return this.calculateWithFallback(monthlySalary);
            }
            throw error;
          }
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
    this.log(`Using FALLBACK NI calculation`, { hasSalary: monthlySalary > 0 });
    const result = calculateNationalInsuranceFallback(monthlySalary);
    
    // Intentionally no integrity check here — fallback is the last resort.
    // If fallback also produces unexpected results, that indicates a deeper issue
    // with calculateNationalInsuranceFallback itself that should be caught in tests.
    return {
      nationalInsurance: Math.max(0, result.nationalInsurance || 0),
      employerNationalInsurance: Math.max(0, result.employerNationalInsurance || 0),
      earningsAtLEL: Math.max(0, result.earningsAtLEL || 0),
      earningsLELtoPT: Math.max(0, result.earningsLELtoPT || 0),
      earningsPTtoUEL: Math.max(0, result.earningsPTtoUEL || 0),
      earningsAboveUEL: Math.max(0, result.earningsAboveUEL || 0),
      earningsAboveST: Math.max(0, result.earningsAboveST || 0),
    };
  }
  
  /**
   * Simple method that just returns the NI contribution amount
   */
  public async calculateAmount(monthlySalary: number): Promise<number> {
    const result = await this.calculate(monthlySalary);
    return result.nationalInsurance;
  }
}
