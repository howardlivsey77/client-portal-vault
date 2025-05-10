
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { calculateMonthlyPayroll } from "@/services/payroll/payrollCalculator";
import { PayrollFormValues } from "../types";
import { PayrollResult } from "@/services/payroll/types";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";
import { supabase } from "@/integrations/supabase/client";

export function usePayrollCalculation(payPeriod: PayPeriod) {
  const { toast } = useToast();
  const [calculationResult, setCalculationResult] = useState<PayrollResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const calculatePayroll = async (payrollDetails: PayrollFormValues) => {
    try {
      setIsCalculating(true);
      const result = calculateMonthlyPayroll(payrollDetails);
      
      // Calculate taxable pay
      result.taxablePay = result.grossPay - result.freePay;
      
      setCalculationResult(result);
      
      // Save the result to the database
      const saved = await savePayrollResultToDatabase(result);
      
      if (!saved) {
        toast({
          title: "Database Save Warning",
          description: "Calculation completed but there was an issue saving to the database.",
          variant: "destructive"
        });
      }
      
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

  const savePayrollResultToDatabase = async (result: PayrollResult) => {
    if (!result.employeeId) {
      console.error("Missing employee ID for saving payroll result");
      return false;
    }
    
    try {
      setIsSaving(true);
      
      const payrollPeriodDate = new Date(payPeriod.year, payPeriod.month - 1, 1);
      const formattedPayrollPeriod = payrollPeriodDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      // Calculate taxable pay
      const taxablePay = result.grossPay - result.freePay;
      
      // Data to save to the database
      const payrollData = {
        employee_id: result.employeeId,
        payroll_period: formattedPayrollPeriod, // Format as YYYY-MM-DD
        tax_year: `${payPeriod.year}/${(payPeriod.year + 1).toString().substring(2)}`,
        tax_period: payPeriod.periodNumber,
        tax_code: result.taxCode,
        student_loan_plan: result.studentLoanPlan || null,
        
        // Financial values - convert to pence/pennies for storage
        gross_pay_this_period: Math.round(result.grossPay * 100),
        taxable_pay_this_period: Math.round(taxablePay * 100),
        free_pay_this_period: Math.round(result.freePay * 100),
        income_tax_this_period: Math.round(result.incomeTax * 100),
        
        pay_liable_to_nic_this_period: Math.round(result.grossPay * 100),
        nic_employee_this_period: Math.round(result.nationalInsurance * 100),
        nic_employer_this_period: 0, // Default to 0, update if available
        nic_letter: 'A', // Default, update if available
        
        student_loan_this_period: Math.round(result.studentLoan * 100),
        employee_pension_this_period: Math.round(result.pensionContribution * 100),
        employer_pension_this_period: 0, // Default to 0, update if available
        
        // NI earnings bands - defaults
        earnings_at_lel_this_period: 0,
        earnings_lel_to_pt_this_period: 0,
        earnings_pt_to_uel_this_period: 0,
        earnings_above_st_this_period: 0,
        earnings_above_uel_this_period: 0,
        
        // Net pay calculation
        net_pay_this_period: Math.round(result.netPay * 100),
        
        // Year-to-date values - would normally be cumulative, but we'll start fresh
        gross_pay_ytd: Math.round(result.grossPay * 100),
        taxable_pay_ytd: Math.round(taxablePay * 100),
        income_tax_ytd: Math.round(result.incomeTax * 100),
        nic_employee_ytd: Math.round(result.nationalInsurance * 100)
      };
      
      console.log(`Checking for existing payroll record for employee ${result.employeeId} in period ${formattedPayrollPeriod}`);
      
      // Check if a record already exists for this employee and pay period
      const { data: existingRecord, error: fetchError } = await supabase
        .from('payroll_results')
        .select('id')
        .eq('employee_id', result.employeeId)
        .eq('payroll_period', formattedPayrollPeriod)
        .maybeSingle();
      
      if (fetchError) {
        console.error("Error checking for existing payroll record:", fetchError);
        throw fetchError;
      }
      
      let saveResponse;
      
      if (existingRecord) {
        console.log(`Found existing record with ID ${existingRecord.id}, updating it.`);
        // Update existing record
        saveResponse = await supabase
          .from('payroll_results')
          .update(payrollData)
          .eq('id', existingRecord.id);
      } else {
        console.log("No existing record found, creating a new one.");
        // Insert new record
        saveResponse = await supabase
          .from('payroll_results')
          .insert(payrollData);
      }
      
      if (saveResponse.error) {
        console.error("Error saving payroll result:", saveResponse.error);
        throw saveResponse.error;
      }
      
      console.log("Payroll result saved successfully");
      toast({
        title: "Payroll Saved",
        description: `Payroll calculation for ${payPeriod.description} has been saved.`,
        variant: "default"
      });
      
      return true;
    } catch (error) {
      console.error("Error saving payroll result:", error);
      toast({
        title: "Save Error",
        description: "There was an error saving the payroll result to the database.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    calculationResult,
    isCalculating,
    isSaving,
    calculatePayroll,
    setCalculationResult
  };
}
