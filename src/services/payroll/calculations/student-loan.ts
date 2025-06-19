
import { roundToTwoDecimals } from "@/lib/formatters";
import { STUDENT_LOAN_THRESHOLDS } from "../constants/tax-constants";

/**
 * Calculate student loan repayments using 2025/26 HMRC monthly thresholds
 * 
 * IMPORTANT: This function calculates student loan deductions using monthly thresholds
 * directly, similar to how National Insurance is calculated. It should be called with 
 * the employee's base monthly salary only, NOT including additional earnings such as 
 * bonuses or overtime. Student loan deductions are calculated based on regular salary 
 * according to HMRC rules.
 * 
 * @param monthlySalary - The employee's base monthly salary (excluding additional earnings)
 * @param planType - The student loan plan type (1, 2, 4, 5, 6, or null)
 * @returns Monthly student loan repayment amount
 */
export function calculateStudentLoan(monthlySalary: number, planType: 1 | 2 | 4 | 5 | 6 | null): number {
  if (!planType) return 0;
  
  let monthlyThreshold, rate;
  
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
  
  console.log(`[Student Loan] Plan ${planType}: Monthly salary £${monthlySalary}, Monthly threshold £${monthlyThreshold}, Rate ${rate * 100}%`);
  
  if (monthlySalary <= monthlyThreshold) {
    console.log(`[Student Loan] No repayment required - monthly salary £${monthlySalary} is below monthly threshold £${monthlyThreshold}`);
    return 0;
  }
  
  const monthlyRepayment = (monthlySalary - monthlyThreshold) * rate;
  const finalRepayment = roundToTwoDecimals(monthlyRepayment);
  
  console.log(`[Student Loan] Monthly repayment: £${finalRepayment} (£${monthlySalary - monthlyThreshold} above threshold × ${rate})`);
  
  return finalRepayment;
}
