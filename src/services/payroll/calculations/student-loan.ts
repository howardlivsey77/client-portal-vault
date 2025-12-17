/**
 * Student Loan Repayment Calculator
 * 
 * REGULATORY BASIS:
 * Per SLC/HMRC guidance, student loan deductions are calculated on regular
 * earnings only, excluding bonuses, overtime, and other additional payments.
 * 
 * References:
 * - HMRC PAYE Manual: https://www.gov.uk/guidance/paye-collection-of-student-loans
 * - Student Loans Company: https://www.slc.co.uk/
 * 
 * Thresholds are updated annually and stored in STUDENT_LOAN_THRESHOLDS.
 * Current thresholds: 2025/26 tax year
 */

import { roundToTwoDecimals } from "@/lib/formatters";
import { STUDENT_LOAN_THRESHOLDS } from "../constants/tax-constants";
import { payrollLogger } from "../utils/payrollLogger";

/**
 * Calculate student loan repayments using HMRC monthly thresholds
 * 
 * @param monthlySalary - The employee's base monthly salary (excluding additional earnings)
 * @param planType - The student loan plan type (1, 2, 4, 5, 6, or null)
 * @returns Monthly student loan repayment amount
 */
export function calculateStudentLoan(monthlySalary: number, planType: 1 | 2 | 4 | 5 | 6 | null): number {
  if (!planType) return 0;
  
  let monthlyThreshold: number;
  let rate: number;
  
  switch (planType) {
    case 1:
      monthlyThreshold = STUDENT_LOAN_THRESHOLDS.PLAN_1.monthly;
      rate = STUDENT_LOAN_THRESHOLDS.PLAN_1.rate;
      break;
    case 2:
      monthlyThreshold = STUDENT_LOAN_THRESHOLDS.PLAN_2.monthly;
      rate = STUDENT_LOAN_THRESHOLDS.PLAN_2.rate;
      break;
    case 4:
      monthlyThreshold = STUDENT_LOAN_THRESHOLDS.PLAN_4.monthly;
      rate = STUDENT_LOAN_THRESHOLDS.PLAN_4.rate;
      break;
    case 5:
      monthlyThreshold = STUDENT_LOAN_THRESHOLDS.PLAN_5.monthly;
      rate = STUDENT_LOAN_THRESHOLDS.PLAN_5.rate;
      break;
    case 6:
      monthlyThreshold = STUDENT_LOAN_THRESHOLDS.PLAN_6.monthly;
      rate = STUDENT_LOAN_THRESHOLDS.PLAN_6.rate;
      break;
    default:
      return 0;
  }
  
  // Log plan type and rate - no monetary amounts
  payrollLogger.calculation('Student loan parameters', { 
    planType, 
    monthlyThreshold,
    ratePercent: rate * 100 
  });
  
  if (monthlySalary <= monthlyThreshold) {
    payrollLogger.debug('Student loan: below threshold', { 
      planType,
      belowThreshold: true 
    });
    return 0;
  }
  
  const monthlyRepayment = (monthlySalary - monthlyThreshold) * rate;
  const finalRepayment = roundToTwoDecimals(monthlyRepayment);
  
  payrollLogger.calculation('Student loan result', { 
    monthlyRepayment: finalRepayment 
  });
  
  return finalRepayment;
}
