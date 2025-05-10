
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";
import { PayrollResult } from "@/services/payroll/types";
import { usePayrollSave } from "./usePayrollSave";

/**
 * Hook for handling payroll database operations
 * @deprecated Use specialized hooks instead: usePayrollSave
 */
export function usePayrollDatabase(payPeriod: PayPeriod) {
  const {
    isSaving,
    isClearing,
    savePayrollResult,
    clearPayrollResultsFromDB
  } = usePayrollSave(payPeriod);

  return {
    isSaving,
    isClearing,
    savePayrollResultToDatabase: savePayrollResult,
    clearPayrollResults: clearPayrollResultsFromDB
  };
}
