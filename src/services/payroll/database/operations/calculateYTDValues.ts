
import { supabase } from "@/integrations/supabase/client";
import { calculateCumulativeTax } from "@/services/payroll/calculations/cumulative-tax";
import { PayrollResult } from "@/services/payroll/types";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";

/**
 * Calculate Year-to-Date values for a payroll result using HMRC cumulative method
 * 
 * This uses the correct HMRC cumulative basis:
 * 1. Free Pay YTD = Monthly Free Pay × Period Number
 * 2. Taxable Pay YTD = Gross Pay YTD - Free Pay YTD (rounded down)
 * 3. Tax Due YTD = Apply tax bands to Taxable Pay YTD
 * 4. Tax This Period = Tax Due YTD - Tax Paid in Previous Periods
 * 
 * This method correctly handles refunds when pay decreases or zero-pay periods occur.
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
    
    // Calculate gross pay YTD
    const previousGrossPayYTD = previousYTD ? previousYTD.gross_pay_ytd / 100 : 0;
    const grossPayYTD = previousGrossPayYTD + result.grossPay;
    
    // Get previous tax paid YTD (in pounds)
    const previousTaxPaidYTD = previousYTD ? previousYTD.income_tax_ytd / 100 : 0;
    
    console.log(`Period ${taxPeriod}: Gross Pay YTD = £${grossPayYTD.toFixed(2)}, Previous Tax Paid = £${previousTaxPaidYTD.toFixed(2)}`);
    
    // Use the HMRC cumulative tax calculation method
    const cumulativeTaxResult = await calculateCumulativeTax(
      taxPeriod,
      grossPayYTD,
      result.taxCode,
      previousTaxPaidYTD,
      taxYear
    );
    
    console.log(`Cumulative Tax Result:`, {
      freePayYTD: cumulativeTaxResult.freePayYTD,
      taxablePayYTD: cumulativeTaxResult.taxablePayYTD,
      taxDueYTD: cumulativeTaxResult.taxDueYTD,
      taxThisPeriod: cumulativeTaxResult.taxThisPeriod
    });
    
    // Convert values to pence for storage
    const grossPayYTDPence = Math.round(grossPayYTD * 100);
    const taxablePayYTDPence = Math.round(cumulativeTaxResult.taxablePayYTD * 100);
    const incomeTaxThisPeriodPence = Math.round(cumulativeTaxResult.taxThisPeriod * 100);
    const incomeTaxYTDPence = Math.round(cumulativeTaxResult.taxDueYTD * 100);
    
    // National Insurance YTD
    const nicEmployeeYTD = previousYTD 
      ? previousYTD.nic_employee_ytd + Math.round(result.nationalInsurance * 100) 
      : Math.round(result.nationalInsurance * 100);
    
    return {
      success: true,
      data: {
        taxablePay: cumulativeTaxResult.taxablePayYTD - (previousYTD ? previousYTD.taxable_pay_ytd / 100 : 0),
        grossPayYTD: grossPayYTDPence,
        taxablePayYTD: taxablePayYTDPence,
        incomeTaxThisPeriod: incomeTaxThisPeriodPence,
        incomeTaxYTD: incomeTaxYTDPence,
        nicEmployeeYTD,
        previousYTD,
        freePayYTD: cumulativeTaxResult.freePayYTD
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
