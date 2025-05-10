
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { calculateMonthlyPayroll } from "@/services/payroll/payrollCalculator";
import { PayrollFormValues } from "../types";
import { PayrollResult } from "@/services/payroll/types";

/**
 * Hook for handling payroll calculation
 */
export function usePayrollResult() {
  const { toast } = useToast();
  const [calculationResult, setCalculationResult] = useState<PayrollResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculatePayroll = async (payrollDetails: PayrollFormValues) => {
    try {
      setIsCalculating(true);
      const result = calculateMonthlyPayroll(payrollDetails);
      
      // Calculate taxable pay
      result.taxablePay = result.grossPay - result.freePay;
      
      setCalculationResult(result);
      setIsCalculating(false);
      return result;
    } catch (error) {
      console.error("Payroll calculation error:", error);
      toast({
        title: "Calculation Error",
        description: "There was an error calculating the payroll. Please check your inputs.",
        variant: "destructive"
      });
      setIsCalculating(false);
      return null;
    }
  };

  return {
    calculationResult,
    isCalculating,
    calculatePayroll,
    setCalculationResult
  };
}
