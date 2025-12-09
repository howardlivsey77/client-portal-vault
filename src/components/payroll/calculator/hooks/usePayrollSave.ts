
import { useState } from 'react';
import { useToast } from "@/hooks";
import { useCompany } from "@/providers";
import { PayrollResult } from "@/services/payroll/types";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";
import { savePayrollResultToDatabase, clearPayrollResults } from "@/services/payroll/database/payrollDatabaseService";

/**
 * Hook for handling payroll database save operations
 */
export function usePayrollSave(payPeriod: PayPeriod) {
  const { toast } = useToast();
  const { currentCompany } = useCompany();
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  /**
   * Save payroll result to the database
   */
  const savePayrollResult = async (result: PayrollResult) => {
    try {
      if (!currentCompany) {
        toast({
          title: "No Company Selected",
          description: "Please select a company before saving payroll results.",
          variant: "destructive"
        });
        return { success: false, updatedResult: null };
      }

      setIsSaving(true);
      const { success, message, error, updatedResult } = await savePayrollResultToDatabase(
        result, 
        payPeriod, 
        currentCompany.id
      );
      
      if (success) {
        toast({
          title: "Payroll Saved",
          description: `Payroll calculation for ${payPeriod.description} has been saved to ${currentCompany.name}.`,
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
      if (!currentCompany) {
        toast({
          title: "No Company Selected",
          description: "Please select a company before clearing payroll results.",
          variant: "destructive"
        });
        return false;
      }

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
    clearPayrollResultsFromDB,
    currentCompany
  };
}
