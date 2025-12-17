
import { supabase } from "@/integrations/supabase/client";
import { calculateCumulativeTax } from "@/services/payroll/calculations/cumulative-tax";
import { PayrollResult } from "@/services/payroll/types";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";

/**
 * YTD calculation result interface
 * All YTD values are derived cumulatively from prior period YTD + unrounded calculation.
 * CRITICAL: Do NOT recompute YTD from summed period rows or rounded display values.
 */
export interface YTDCalculationResult {
  taxablePay: number;
  grossPayYTD: number;
  taxablePayYTD: number;
  incomeTaxThisPeriod: number;
  incomeTaxYTD: number;
  nicEmployeeYTD: number;
  nicEmployerYTD: number;
  studentLoanYTD: number;
  employeePensionYTD: number;
  employerPensionYTD: number;
  nhsPensionEmployeeYTD: number;
  nhsPensionEmployerYTD: number;
  freePayYTD: number;
  netPayYTD: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previousYTD: Record<string, any> | null;
}

/**
 * Calculate Year-to-Date values for a payroll result using HMRC cumulative method
 * 
 * This uses the correct HMRC cumulative basis:
 * 1. Free Pay YTD = Monthly Free Pay × Period Number
 * 2. Taxable Pay YTD = Gross Pay YTD - Free Pay YTD (rounded down)
 * 3. Tax Due YTD = Apply tax bands to Taxable Pay YTD
 * 4. Tax This Period = Tax Due YTD - Tax Paid in Previous Periods
 * 
 * CRITICAL: YTD values must be WRITE-ONCE, derived-only.
 * When writing period N:
 * - Read period N−1 YTD values
 * - Add unrounded internal amounts
 * - Write the new YTD totals
 * Never recompute YTD from summed period rows or rounded display values.
 */
export async function calculateYTDValues(
  result: PayrollResult,
  payPeriod: PayPeriod,
  taxYear: string,
  taxPeriod: number
): Promise<{ success: boolean; error?: string; data?: YTDCalculationResult }> {
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
    
    // ============================================================
    // GROSS PAY YTD - Cumulative from prior period
    // ============================================================
    const previousGrossPayYTD = previousYTD ? previousYTD.gross_pay_ytd / 100 : 0;
    const grossPayYTD = previousGrossPayYTD + result.grossPay;
    
    // ============================================================
    // TAX CALCULATION - Using HMRC cumulative method
    // ============================================================
    const previousTaxPaidYTD = previousYTD ? previousYTD.income_tax_ytd / 100 : 0;
    
    console.log(`Period ${taxPeriod}: Gross Pay YTD = £${grossPayYTD.toFixed(2)}, Previous Tax Paid = £${previousTaxPaidYTD.toFixed(2)}`);
    
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
    
    // ============================================================
    // NI YTD - Cumulative from prior period + unrounded current
    // ============================================================
    const previousNicEmployeeYTD = previousYTD ? previousYTD.nic_employee_ytd : 0;
    const nicEmployeeYTD = previousNicEmployeeYTD + Math.round(result.nationalInsurance * 100);
    
    const previousNicEmployerYTD = previousYTD ? (previousYTD.nic_employer_ytd || 0) : 0;
    const nicEmployerYTD = previousNicEmployerYTD + Math.round((result.employerNationalInsurance || 0) * 100);
    
    // ============================================================
    // STUDENT LOAN YTD - Cumulative from prior period
    // ============================================================
    const previousStudentLoanYTD = previousYTD ? (previousYTD.student_loan_ytd || 0) : 0;
    const studentLoanYTD = previousStudentLoanYTD + Math.round(result.studentLoan * 100);
    
    // ============================================================
    // PENSION YTD - Cumulative from prior period (non-NHS)
    // ============================================================
    const previousEmployeePensionYTD = previousYTD ? (previousYTD.employee_pension_ytd || 0) : 0;
    const employeePensionYTD = previousEmployeePensionYTD + Math.round(result.pensionContribution * 100);
    
    // Employer pension (non-NHS) - currently defaulted to 0, but structure is ready
    const previousEmployerPensionYTD = previousYTD ? (previousYTD.employer_pension_ytd || 0) : 0;
    const employerPensionYTD = previousEmployerPensionYTD + 0; // Update when employer pension is tracked
    
    // ============================================================
    // NHS PENSION YTD - Cumulative from prior period
    // FIXED: Was incorrectly using "this period" value instead of cumulative
    // ============================================================
    const previousNhsPensionEmployeeYTD = previousYTD ? (previousYTD.nhs_pension_employee_ytd || 0) : 0;
    const nhsPensionEmployeeYTD = previousNhsPensionEmployeeYTD + Math.round((result.nhsPensionEmployeeContribution || 0) * 100);
    
    const previousNhsPensionEmployerYTD = previousYTD ? (previousYTD.nhs_pension_employer_ytd || 0) : 0;
    const nhsPensionEmployerYTD = previousNhsPensionEmployerYTD + Math.round((result.nhsPensionEmployerContribution || 0) * 100);
    
    // ============================================================
    // FREE PAY YTD - From cumulative tax calculation
    // ============================================================
    const freePayYTD = Math.round(cumulativeTaxResult.freePayYTD * 100);
    
    // ============================================================
    // NET PAY YTD - Cumulative from prior period
    // ============================================================
    const previousNetPayYTD = previousYTD ? (previousYTD.net_pay_ytd || 0) : 0;
    const netPayYTD = previousNetPayYTD + Math.round(result.netPay * 100);
    
    // ============================================================
    // Convert values to pence for storage
    // ============================================================
    const grossPayYTDPence = Math.round(grossPayYTD * 100);
    const taxablePayYTDPence = Math.round(cumulativeTaxResult.taxablePayYTD * 100);
    const incomeTaxThisPeriodPence = Math.round(cumulativeTaxResult.taxThisPeriod * 100);
    const incomeTaxYTDPence = Math.round(cumulativeTaxResult.taxDueYTD * 100);
    
    console.log(`YTD Calculations Complete:`, {
      grossPayYTD: grossPayYTDPence,
      taxablePayYTD: taxablePayYTDPence,
      incomeTaxYTD: incomeTaxYTDPence,
      nicEmployeeYTD,
      nicEmployerYTD,
      studentLoanYTD,
      employeePensionYTD,
      nhsPensionEmployeeYTD,
      nhsPensionEmployerYTD,
      freePayYTD,
      netPayYTD
    });
    
    return {
      success: true,
      data: {
        taxablePay: cumulativeTaxResult.taxablePayYTD - (previousYTD ? previousYTD.taxable_pay_ytd / 100 : 0),
        grossPayYTD: grossPayYTDPence,
        taxablePayYTD: taxablePayYTDPence,
        incomeTaxThisPeriod: incomeTaxThisPeriodPence,
        incomeTaxYTD: incomeTaxYTDPence,
        nicEmployeeYTD,
        nicEmployerYTD,
        studentLoanYTD,
        employeePensionYTD,
        employerPensionYTD,
        nhsPensionEmployeeYTD,
        nhsPensionEmployerYTD,
        freePayYTD,
        netPayYTD,
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
