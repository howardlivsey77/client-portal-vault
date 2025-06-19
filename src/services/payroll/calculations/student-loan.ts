
import { roundToTwoDecimals } from "@/lib/formatters";
import { STUDENT_LOAN_THRESHOLDS } from "../constants/tax-constants";

/**
 * Calculate student loan repayments using 2025/26 HMRC thresholds
 * 
 * IMPORTANT: This function should be called with the employee's base monthly salary only,
 * NOT including additional earnings such as bonuses or overtime. Student loan deductions
 * are calculated based on regular salary according to HMRC rules.
 * 
 * @param monthlySalary - The employee's base monthly salary (excluding additional earnings)
 * @param planType - The student loan plan type (1, 2, 4, 5, 6, or null)
 * @returns Monthly student loan repayment amount
 */
export function calculateStudentLoan(monthlySalary: number, planType: 1 | 2 | 4 | 5 | 6 | null): number {
  if (!planType) return 0;
  
  const annualSalary = monthlySalary * 12;
  let threshold, rate;
  
  switch (planType) {
    case 1:
      threshold = STUDENT_LOAN_THRESHOLDS.PLAN_1.annual;
      rate = STUDENT_LOAN_THRESHOLDS.PLAN_1.rate;
      break;
    case 2:
      threshold = STUDENT_LOAN_THRESHOLDS.PLAN_2.annual;
      rate = STUDENT_LOAN_THRESHOLDS.PLAN_2.rate;
      break;
    case 4:
      threshold = STUDENT_LOAN_THRESHOLDS.PLAN_4.annual;
      rate = STUDENT_LOAN_THRESHOLDS.PLAN_4.rate;
      break;
    case 5:
      threshold = STUDENT_LOAN_THRESHOLDS.PLAN_5.annual;
      rate = STUDENT_LOAN_THRESHOLDS.PLAN_5.rate;
      break;
    case 6:
      threshold = STUDENT_LOAN_THRESHOLDS.PLAN_6.annual;
      rate = STUDENT_LOAN_THRESHOLDS.PLAN_6.rate;
      break;
    default:
      return 0;
  }
  
  console.log(`[Student Loan] Plan ${planType}: Annual salary £${annualSalary} (monthly: £${monthlySalary}), Threshold £${threshold}, Rate ${rate * 100}%`);
  
  if (annualSalary <= threshold) {
    console.log(`[Student Loan] No repayment required - annual salary £${annualSalary} is below threshold £${threshold}`);
    return 0;
  }
  
  const monthlyRepayment = ((annualSalary - threshold) / 12) * rate;
  const finalRepayment = roundToTwoDecimals(monthlyRepayment);
  
  console.log(`[Student Loan] Monthly repayment: £${finalRepayment} (£${annualSalary - threshold} above threshold × ${rate})`);
  
  return finalRepayment;
}
