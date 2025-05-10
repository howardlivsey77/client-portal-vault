
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
    clearPayrollResultsFromDB
  } = usePayrollSave(payPeriod);

  /**
   * Calculate payroll and save to database
   */
  const calculatePayroll = async (payrollDetails: PayrollFormValues) => {
    const result = await calculatePayrollOnly(payrollDetails);
    
    if (result) {
      // Save the result to the database
      await savePayrollResult(result);
    }
    
    return result;
  };

  return {
    calculationResult,
    isCalculating,
    isSaving,
    isClearing,
    calculatePayroll,
    clearPayrollResults: clearPayrollResultsFromDB,
    setCalculationResult
  };
}
