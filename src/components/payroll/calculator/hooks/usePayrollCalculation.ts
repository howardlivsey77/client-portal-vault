
import { useState } from 'react';
import { PayrollFormValues } from "../types";
import { PayrollResult } from "@/services/payroll/types";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";
import { usePayrollResult } from './usePayrollResult';
import { usePayrollSave } from './usePayrollSave';

/**
 * Main hook that combines calculation and database operations for payroll
 */
export function usePayrollCalculation(payPeriod: PayPeriod) {
  const {
    calculationResult,
    isCalculating,
    calculatePayroll: calculatePayrollOnly,
    setCalculationResult
  } = usePayrollResult();
  
  const {
    isSaving,
    isClearing,
    savePayrollResult,
    clearPayrollResultsFromDB,
    currentCompany
  } = usePayrollSave(payPeriod);

  /**
   * Calculate payroll and save to database
   */
  const calculatePayroll = async (payrollDetails: PayrollFormValues) => {
    // First calculate the result
    const initialResult = await calculatePayrollOnly(payrollDetails);
    
    if (initialResult) {
      console.log("Initial calculation result:", initialResult);
      
      // Save the result to the database
      const { success, updatedResult } = await savePayrollResult(initialResult);
      
      if (success && updatedResult) {
        // Important: Update the calculation result with the values from the database
        console.log("Updated result from database:", updatedResult);
        setCalculationResult(updatedResult);
        return updatedResult;
      }
      
      return initialResult;
    }
    
    return null;
  };

  return {
    calculationResult,
    isCalculating,
    isSaving,
    isClearing,
    calculatePayroll,
    clearPayrollResults: clearPayrollResultsFromDB,
    setCalculationResult,
    currentCompany
  };
}
