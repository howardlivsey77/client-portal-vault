
import { supabase } from "@/integrations/supabase/client";
import { calculateIncomeTaxFromYTDAsync } from "@/services/payroll/calculations/income-tax";
import { PayrollResult } from "@/services/payroll/types";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";

/**
 * Round down to nearest pound for taxable pay
 */
function roundDownToNearestPound(amount: number): number {
  return Math.floor(amount);
}

/**
 * Calculate Year-to-Date values for a payroll result
 */
export async function calculateYTDValues(
  result: PayrollResult,
  payPeriod: PayPeriod,
  taxYear: string,
  taxPeriod: number
) {
  try {
    if (!result.employeeId) {
      return { success: false, error: "Missing employee ID" };
    }

    // Get previous period's YTD values
    const { data: previousPeriods, error: fetchError } = await supabase
      .from('payroll_results')
      .select('*')
      .eq('employee_id', result.employeeId)
      .eq('tax_year', taxYear)
      .lt('tax_period', taxPeriod)
      .order('tax_period', { ascending: false })
      .limit(1);
    
    if (fetchError) {
      console.error("Error fetching previous periods:", fetchError);
      return { success: false, error: fetchError.message };
    }
    
    // Previous YTD values or default to 0 if first period
    const previousYTD = previousPeriods && previousPeriods.length > 0 ? previousPeriods[0] : null;
    
    // Calculate taxable pay and round down to nearest pound
    const taxablePay = roundDownToNearestPound(result.grossPay - result.freePay);
    
    // Calculate YTD values
    const grossPayYTD = previousYTD ? previousYTD.gross_pay_ytd + Math.round(result.grossPay * 100) : Math.round(result.grossPay * 100);
    const taxablePayYTD = previousYTD ? previousYTD.taxable_pay_ytd + Math.round(taxablePay * 100) : Math.round(taxablePay * 100);
    
    console.log(`YTD values: Gross Pay = ${grossPayYTD/100}, Taxable Pay = ${taxablePayYTD/100}`);
    
    // Calculate total income tax based on YTD taxable pay
    const totalTaxDueYTD = await calculateIncomeTaxFromYTDAsync(taxablePayYTD / 100, result.taxCode, taxYear);
    
    console.log(`Total tax due YTD: ${totalTaxDueYTD}`);
    
    // Previous tax paid YTD or 0 if first period
    const previousTaxPaidYTD = previousYTD ? previousYTD.income_tax_ytd : 0;
    
    console.log(`Previous tax paid YTD: ${previousTaxPaidYTD/100}`);
    
    // This period's tax is the difference between total tax due and tax already paid
    const incomeTaxThisPeriod = Math.round((totalTaxDueYTD - (previousTaxPaidYTD / 100)) * 100);
    
    console.log(`Income tax this period: ${incomeTaxThisPeriod/100}`);
    
    // New YTD tax is previous YTD + this period
    const incomeTaxYTD = previousYTD ? previousYTD.income_tax_ytd + incomeTaxThisPeriod : incomeTaxThisPeriod;
    
    // National Insurance YTD
    const nicEmployeeYTD = previousYTD ? previousYTD.nic_employee_ytd + Math.round(result.nationalInsurance * 100) : Math.round(result.nationalInsurance * 100);
    
    return {
      success: true,
      data: {
        taxablePay,
        grossPayYTD,
        taxablePayYTD,
        incomeTaxThisPeriod,
        incomeTaxYTD,
        nicEmployeeYTD,
        previousYTD
      }
    };
  } catch (error) {
    console.error("Error calculating YTD values:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
