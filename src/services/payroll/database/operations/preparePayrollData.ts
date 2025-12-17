
import { PayrollResult } from "@/services/payroll/types";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";
import { calculateYTDValues } from "./calculateYTDValues";

/**
 * Prepare payroll data for database storage
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
    
    const payrollPeriodDate = new Date(payPeriod.year, payPeriod.month - 1, 1);
    const formattedPayrollPeriod = payrollPeriodDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    // Tax year in format YYYY/YY
    const taxYear = `${payPeriod.year}/${(payPeriod.year + 1).toString().substring(2)}`;
    const taxPeriod = payPeriod.periodNumber;
    
    console.log(`[PREPARE] Processing payroll for tax year: ${taxYear}, period: ${taxPeriod}, company: ${companyId}`);
    
    // Get YTD values
    const ytdResult = await calculateYTDValues(result, payPeriod, taxYear, taxPeriod);
    
    if (!ytdResult.success) {
      console.error(`[PREPARE] Error calculating YTD values: ${ytdResult.error}`);
      return { success: false, error: ytdResult.error };
    }
    
    const { 
      taxablePay,
      grossPayYTD, 
      taxablePayYTD, 
      incomeTaxThisPeriod, 
      incomeTaxYTD, 
      nicEmployeeYTD 
    } = ytdResult.data;
    
    console.log(`[PREPARE] Prepared taxable pay (rounded down): £${taxablePay}`);
    console.log(`[PREPARE] Income tax this period (from YTD calc): £${incomeTaxThisPeriod/100}`);
    
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
    
    // ADDED: Additional validation for NIC earnings bands according to HMRC rules
    const totalBandEarnings = earningsAtLEL + earningsLELtoPT + earningsPTtoUEL + earningsAboveUEL;
    if (Math.abs(totalBandEarnings - result.grossPay) > 0.01) {
      console.warn(`[PREPARE] WARNING: NIC earnings bands don't sum to gross pay`);
      console.warn(`[PREPARE] Total bands: £${totalBandEarnings}, Gross pay: £${result.grossPay}`);
      console.warn(`[PREPARE] This indicates a potential issue with the NIC band calculations`);
    }
    
    // ADDED: Validate HMRC reporting rules
    if (result.grossPay > 542 && earningsAtLEL !== 542) {
      console.warn(`[PREPARE] HMRC Rule Check: Salary above LEL (£542) but LEL band is not £542. Current LEL: £${earningsAtLEL}`);
    }
    if (result.grossPay > 1048 && earningsLELtoPT !== (1048 - 542)) {
      console.warn(`[PREPARE] HMRC Rule Check: Salary above PT (£1048) but LEL to PT band is not £506. Current LEL to PT: £${earningsLELtoPT}`);
    }
    
    // Convert earnings band values to pennies for database storage
    const earningsAtLELPennies = Math.round(earningsAtLEL * 100);
    const earningsLELtoPTPennies = Math.round(earningsLELtoPT * 100);
    const earningsPTtoUELPennies = Math.round(earningsPTtoUEL * 100);
    const earningsAboveUELPennies = Math.round(earningsAboveUEL * 100);
    const earningsAboveSTPennies = Math.round(earningsAboveST * 100);
    const nicEmployeeThisPeriodPennies = Math.round(niValue * 100);
    
    // NHS Pension values in pennies
    const nhsPensionEmployeeThisPeriodPennies = Math.round((result.nhsPensionEmployeeContribution || 0) * 100);
    const nhsPensionEmployerThisPeriodPennies = Math.round((result.nhsPensionEmployerContribution || 0) * 100);
    
    // Verify NI values before saving - This is critical for debugging
    console.log(`[PREPARE] NI values in pennies for database: 
      - NI Employee: ${nicEmployeeThisPeriodPennies} pennies (£${nicEmployeeThisPeriodPennies/100})
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
    
    // Full salary info for NI eligibility check
    console.log(`[PREPARE] Full salary info for ${result.employeeName}: £${result.monthlySalary} monthly, £${result.grossPay} gross pay`);
    
    // Data to save to the database
    const payrollData = {
      employee_id: result.employeeId,
      company_id: companyId, // ADDED: Include company_id
      payroll_period: formattedPayrollPeriod,
      tax_year: taxYear,
      tax_period: taxPeriod,
      tax_code: result.taxCode,
      student_loan_plan: result.studentLoanPlan || null,
      
      // Financial values - convert to pence/pennies for storage
      gross_pay_this_period: Math.round(result.grossPay * 100),
      taxable_pay_this_period: Math.round(taxablePay * 100),
      free_pay_this_period: Math.round(result.freePay * 100),
      income_tax_this_period: incomeTaxThisPeriod,
      
      pay_liable_to_nic_this_period: Math.round(result.grossPay * 100),
      nic_employee_this_period: nicEmployeeThisPeriodPennies,
      nic_employer_this_period: Math.round((result.employerNationalInsurance || 0) * 100),
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
      
      // NHS Pension fields
      nhs_pension_employee_this_period: nhsPensionEmployeeThisPeriodPennies,
      nhs_pension_employer_this_period: nhsPensionEmployerThisPeriodPennies,
      nhs_pension_employee_ytd: nhsPensionEmployeeThisPeriodPennies, // For now, same as this period
      nhs_pension_employer_ytd: nhsPensionEmployerThisPeriodPennies, // For now, same as this period
      nhs_pension_tier: result.nhsPensionTier || null,
      nhs_pension_employee_rate: result.nhsPensionEmployeeRate || null,
      nhs_pension_employer_rate: result.nhsPensionEmployerRate || null,
      
      // Net pay calculation
      net_pay_this_period: Math.round(result.netPay * 100),
      
      // Year-to-date values
      gross_pay_ytd: grossPayYTD,
      taxable_pay_ytd: taxablePayYTD,
      income_tax_ytd: incomeTaxYTD,
      nic_employee_ytd: nicEmployeeYTD
    };
    
    console.log(`[PREPARE] Final payroll data prepared successfully with company_id ${companyId}:`, payrollData);
    
    return { 
      success: true, 
      payrollData, 
      taxYear, 
      taxPeriod,
      ytdData: ytdResult.data 
    };
  } catch (error) {
    console.error("[PREPARE] Error preparing payroll data:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
