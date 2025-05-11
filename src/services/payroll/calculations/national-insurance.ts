
/**
 * This file is kept for backward compatibility
 * It re-exports all National Insurance calculation functionality from the refactored files
 */

export { 
  calculateNationalInsuranceAsync,
  calculateNationalInsurance,
  type NICalculationResult
} from './ni/index';
