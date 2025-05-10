
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { PayrollResult } from "@/services/payroll/types";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";
import { savePayrollResultToDatabase, clearPayrollResults } from "@/services/payroll/database/payrollDatabaseService";

/**
 * Hook for handling payroll database save operations
 */
export function usePayrollSave(payPeriod: PayPeriod) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  /**
   * Save payroll result to the database
   */
  const savePayrollResult = async (result: PayrollResult) => {
    try {
      setIsSaving(true);
      const { success, message, error, updatedResult } = await savePayrollResultToDatabase(result, payPeriod);
      
      if (success) {
        toast({
          title: "Payroll Saved",
          description: `Payroll calculation for ${payPeriod.description} has been saved.`,
          variant: "default"
        });
        
        // Return the updated result that includes the database values
        return { success: true, updatedResult };
      } else {
        toast({
          title: "Save Error",
          description: error || "There was an error saving the payroll result to the database.",
          variant: "destructive"
        });
        return { success: false, updatedResult: null };
      }
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Clear all payroll results from the database
   */
  const clearPayrollResultsFromDB = async () => {
    try {
      setIsClearing(true);
      const { success, message, error } = await clearPayrollResults();
      
      if (success) {
        toast({
          title: "Success",
          description: message || "All payroll results have been cleared.",
          variant: "default"
        });
        return true;
      } else {
        toast({
          title: "Error",
          description: error || "There was an error clearing the payroll results table.",
          variant: "destructive"
        });
        return false;
      }
    } finally {
      setIsClearing(false);
    }
  };

  return {
    isSaving,
    isClearing,
    savePayrollResult,
    clearPayrollResultsFromDB
  };
}
