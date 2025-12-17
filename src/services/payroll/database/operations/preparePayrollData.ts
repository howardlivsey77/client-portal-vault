
import { PayrollResult } from "@/services/payroll/types";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";
import { calculateYTDValues } from "./calculateYTDValues";

/**
 * Prepare payroll data for database storage
 * 
 * CRITICAL: All YTD values are derived cumulatively from prior period YTD + unrounded calculation.
 * Do NOT recompute YTD from summed period rows or rounded display values.
 */
export async function preparePayrollData(result: PayrollResult, payPeriod: PayPeriod, companyId: string) {
  try {
    if (!result.employeeId) {
      return { success: false, error: "Missing employee ID for saving payroll result" };
    }
    
    if (!companyId) {
      return { success: false, error: "Missing company ID for saving payroll result" };
    }
    
    console.log(`[PREPARE] Preparing payroll data for database storage for ${result.employeeName} (Company: ${companyId})`);
    console.log(`[PREPARE] NI values to convert to pennies: 
      - NI: £${result.nationalInsurance}
      - LEL: £${result.earningsAtLEL}
      - LEL to PT: £${result.earningsLELtoPT}
      - PT to UEL: £${result.earningsPTtoUEL}
      - Above UEL: £${result.earningsAboveUEL}
      - Above ST: £${result.earningsAboveST}
    `);
    
    console.log(`[PREPARE] NHS pension values:
      - Employee contribution: £${result.nhsPensionEmployeeContribution}
      - Employer contribution: £${result.nhsPensionEmployerContribution}
      - Tier: ${result.nhsPensionTier}
      - Employee rate: ${result.nhsPensionEmployeeRate}%
      - Employer rate: ${result.nhsPensionEmployerRate}%
    `);
    
    // Calculate period dates
    const periodStartDate = new Date(payPeriod.year, payPeriod.month - 1, 1);
    const periodEndDate = new Date(payPeriod.year, payPeriod.month, 0); // Last day of month
    const paymentDate = periodEndDate; // Default to end of period, can be customized
    
    const formattedPayrollPeriod = periodStartDate.toISOString().split('T')[0];
    const formattedPeriodStartDate = periodStartDate.toISOString().split('T')[0];
    const formattedPeriodEndDate = periodEndDate.toISOString().split('T')[0];
    const formattedPaymentDate = paymentDate.toISOString().split('T')[0];
    
    // Tax year in format YYYY/YY
    const taxYear = `${payPeriod.year}/${(payPeriod.year + 1).toString().substring(2)}`;
    const taxPeriod = payPeriod.periodNumber;
    
    console.log(`[PREPARE] Processing payroll for tax year: ${taxYear}, period: ${taxPeriod}, company: ${companyId}`);
    
    // Get YTD values - these are cumulative from prior periods
    const ytdResult = await calculateYTDValues(result, payPeriod, taxYear, taxPeriod);
    
    if (!ytdResult.success || !ytdResult.data) {
      console.error(`[PREPARE] Error calculating YTD values: ${ytdResult.error}`);
      return { success: false, error: ytdResult.error };
    }
    
    const ytdData = ytdResult.data;
    
    console.log(`[PREPARE] Prepared taxable pay (rounded down): £${ytdData.taxablePay}`);
    console.log(`[PREPARE] Income tax this period (from YTD calc): £${ytdData.incomeTaxThisPeriod/100}`);
    
    // Ensure we have valid values for all NI fields
    const niValue = Math.max(0, result.nationalInsurance || 0);
    const earningsAtLEL = Math.max(0, result.earningsAtLEL || 0);
    const earningsLELtoPT = Math.max(0, result.earningsLELtoPT || 0);
    const earningsPTtoUEL = Math.max(0, result.earningsPTtoUEL || 0);
    const earningsAboveUEL = Math.max(0, result.earningsAboveUEL || 0);
    const earningsAboveST = Math.max(0, result.earningsAboveST || 0);
    
    console.log(`[PREPARE] Validated NI values:
      - NI: £${niValue} (original: £${result.nationalInsurance})
      - LEL: £${earningsAtLEL} (original: £${result.earningsAtLEL})
      - LEL to PT: £${earningsLELtoPT} (original: £${result.earningsLELtoPT})
      - PT to UEL: £${earningsPTtoUEL} (original: £${result.earningsPTtoUEL})
      - Above UEL: £${earningsAboveUEL} (original: £${result.earningsAboveUEL})
      - Above ST: £${earningsAboveST} (original: £${result.earningsAboveST})
    `);
    
    // Validation: NIC earnings bands should sum to gross pay
    const totalBandEarnings = earningsAtLEL + earningsLELtoPT + earningsPTtoUEL + earningsAboveUEL;
    if (Math.abs(totalBandEarnings - result.grossPay) > 0.01) {
      console.warn(`[PREPARE] WARNING: NIC earnings bands don't sum to gross pay`);
      console.warn(`[PREPARE] Total bands: £${totalBandEarnings}, Gross pay: £${result.grossPay}`);
      console.warn(`[PREPARE] This indicates a potential issue with the NIC band calculations`);
    }
    
    // NOTE: Removed hard-coded HMRC threshold checks (£542, £1048)
    // These values are tax-year dependent and should be derived from the nic_bands table
    // The actual threshold validation happens in the NI calculation service
    
    // Convert earnings band values to pennies for database storage
    const earningsAtLELPennies = Math.round(earningsAtLEL * 100);
    const earningsLELtoPTPennies = Math.round(earningsLELtoPT * 100);
    const earningsPTtoUELPennies = Math.round(earningsPTtoUEL * 100);
    const earningsAboveUELPennies = Math.round(earningsAboveUEL * 100);
    const earningsAboveSTPennies = Math.round(earningsAboveST * 100);
    const nicEmployeeThisPeriodPennies = Math.round(niValue * 100);
    const nicEmployerThisPeriodPennies = Math.round((result.employerNationalInsurance || 0) * 100);
    
    // NHS Pension values in pennies
    const nhsPensionEmployeeThisPeriodPennies = Math.round((result.nhsPensionEmployeeContribution || 0) * 100);
    const nhsPensionEmployerThisPeriodPennies = Math.round((result.nhsPensionEmployerContribution || 0) * 100);
    
    // Verify NI values before saving
    console.log(`[PREPARE] NI values in pennies for database: 
      - NI Employee: ${nicEmployeeThisPeriodPennies} pennies (£${nicEmployeeThisPeriodPennies/100})
      - NI Employer: ${nicEmployerThisPeriodPennies} pennies (£${nicEmployerThisPeriodPennies/100})
      - LEL: ${earningsAtLELPennies} pennies (£${earningsAtLELPennies/100})
      - LEL to PT: ${earningsLELtoPTPennies} pennies (£${earningsLELtoPTPennies/100})
      - PT to UEL: ${earningsPTtoUELPennies} pennies (£${earningsPTtoUELPennies/100})
      - Above UEL: ${earningsAboveUELPennies} pennies (£${earningsAboveUELPennies/100})
      - Above ST: ${earningsAboveSTPennies} pennies (£${earningsAboveSTPennies/100})
    `);
    
    console.log(`[PREPARE] NHS pension values in pennies:
      - Employee contribution: ${nhsPensionEmployeeThisPeriodPennies} pennies (£${nhsPensionEmployeeThisPeriodPennies/100})
      - Employer contribution: ${nhsPensionEmployerThisPeriodPennies} pennies (£${nhsPensionEmployerThisPeriodPennies/100})
    `);
    
    console.log(`[PREPARE] Full salary info for ${result.employeeName}: £${result.monthlySalary} monthly, £${result.grossPay} gross pay`);
    
    // Data to save to the database
    // CRITICAL: YTD values come from calculateYTDValues which derives them cumulatively
    const payrollData = {
      employee_id: result.employeeId,
      company_id: companyId,
      payroll_period: formattedPayrollPeriod,
      period_start_date: formattedPeriodStartDate,
      period_end_date: formattedPeriodEndDate,
      payment_date: formattedPaymentDate,
      tax_year: taxYear,
      tax_period: taxPeriod,
      tax_code: result.taxCode,
      student_loan_plan: result.studentLoanPlan || null,
      
      // Financial values - convert to pence/pennies for storage
      gross_pay_this_period: Math.round(result.grossPay * 100),
      taxable_pay_this_period: Math.round(ytdData.taxablePay * 100),
      free_pay_this_period: Math.round(result.freePay * 100),
      income_tax_this_period: ytdData.incomeTaxThisPeriod,
      
      pay_liable_to_nic_this_period: Math.round(result.grossPay * 100),
      nic_employee_this_period: nicEmployeeThisPeriodPennies,
      nic_employer_this_period: nicEmployerThisPeriodPennies,
      nic_letter: 'A', // Default, update if available
      
      student_loan_this_period: Math.round(result.studentLoan * 100),
      employee_pension_this_period: Math.round(result.pensionContribution * 100),
      employer_pension_this_period: 0, // Default to 0, update if available
      
      // NI earnings bands - using corrected HMRC-compliant values
      earnings_at_lel_this_period: earningsAtLELPennies,
      earnings_lel_to_pt_this_period: earningsLELtoPTPennies,
      earnings_pt_to_uel_this_period: earningsPTtoUELPennies,
      earnings_above_uel_this_period: earningsAboveUELPennies,
      earnings_above_st_this_period: earningsAboveSTPennies,
      
      // NHS Pension fields - this period
      nhs_pension_employee_this_period: nhsPensionEmployeeThisPeriodPennies,
      nhs_pension_employer_this_period: nhsPensionEmployerThisPeriodPennies,
      nhs_pension_tier: result.nhsPensionTier || null,
      nhs_pension_employee_rate: result.nhsPensionEmployeeRate || null,
      nhs_pension_employer_rate: result.nhsPensionEmployerRate || null,
      
      // Net pay calculation
      net_pay_this_period: Math.round(result.netPay * 100),
      
      // ============================================================
      // Year-to-date values - ALL derived cumulatively from calculateYTDValues
      // CRITICAL: These are NOT recomputed from period rows
      // ============================================================
      gross_pay_ytd: ytdData.grossPayYTD,
      taxable_pay_ytd: ytdData.taxablePayYTD,
      income_tax_ytd: ytdData.incomeTaxYTD,
      nic_employee_ytd: ytdData.nicEmployeeYTD,
      nic_employer_ytd: ytdData.nicEmployerYTD,
      student_loan_ytd: ytdData.studentLoanYTD,
      employee_pension_ytd: ytdData.employeePensionYTD,
      employer_pension_ytd: ytdData.employerPensionYTD,
      nhs_pension_employee_ytd: ytdData.nhsPensionEmployeeYTD, // FIXED: Now cumulative
      nhs_pension_employer_ytd: ytdData.nhsPensionEmployerYTD, // FIXED: Now cumulative
      free_pay_ytd: ytdData.freePayYTD,
      net_pay_ytd: ytdData.netPayYTD
    };
    
    console.log(`[PREPARE] Final payroll data prepared successfully with company_id ${companyId}`);
    console.log(`[PREPARE] YTD values:`, {
      gross_pay_ytd: payrollData.gross_pay_ytd,
      income_tax_ytd: payrollData.income_tax_ytd,
      nic_employee_ytd: payrollData.nic_employee_ytd,
      nic_employer_ytd: payrollData.nic_employer_ytd,
      student_loan_ytd: payrollData.student_loan_ytd,
      nhs_pension_employee_ytd: payrollData.nhs_pension_employee_ytd,
      nhs_pension_employer_ytd: payrollData.nhs_pension_employer_ytd,
      net_pay_ytd: payrollData.net_pay_ytd
    });
    
    return { 
      success: true, 
      payrollData, 
      taxYear, 
      taxPeriod,
      ytdData
    };
  } catch (error) {
    console.error("[PREPARE] Error preparing payroll data:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
