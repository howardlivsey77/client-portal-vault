
import { roundToTwoDecimals } from "@/lib/formatters";

// Annual thresholds for student loan repayments
const PLAN_1_THRESHOLD = 22015; // £22,015 per year
const PLAN_2_THRESHOLD = 27295; // £27,295 per year
const PLAN_4_THRESHOLD = 27660; // £27,660 per year
const PLAN_5_THRESHOLD = 25000; // £25,000 per year
const POSTGRAD_THRESHOLD = 21000; // £21,000 per year

/**
 * Calculate student loan repayment amount for the given plan
 * @param grossSalary Monthly gross salary
 * @param plan Student loan plan type ('1', '2', '4', '5', 'PGL', or null)
 * @returns Monthly student loan repayment amount
 */
export function calculateStudentLoan(
  grossSalary: number, 
  plan: string | null | undefined
): number {
  // If no plan specified, return 0
  if (!plan) return 0;
  
  // Convert monthly salary to annual for threshold checks
  const annualizedSalary = grossSalary * 12;
  
  // Default repayment rate
  const rate = 0.09; // 9%
  const postgradRate = 0.06; // 6% for postgraduate loans
  
  // Determine threshold based on plan
  let threshold: number;
  let repaymentRate: number = rate;
  
  switch (plan) {
    case '1':
      threshold = PLAN_1_THRESHOLD;
      break;
    case '2':
      threshold = PLAN_2_THRESHOLD;
      break;
    case '4':
      threshold = PLAN_4_THRESHOLD;
      break;
    case '5':
      threshold = PLAN_5_THRESHOLD;
      break;
    case 'PGL':
      threshold = POSTGRAD_THRESHOLD;
      repaymentRate = postgradRate;
      break;
    default:
      return 0; // Unknown plan
  }
  
  // Check if salary is above threshold
  if (annualizedSalary <= threshold) {
    return 0; // No repayment required
  }
  
  // Calculate annual repayment
  const annualRepayment = (annualizedSalary - threshold) * repaymentRate;
  
  // Convert to monthly repayment
  const monthlyRepayment = annualRepayment / 12;
  
  return roundToTwoDecimals(monthlyRepayment);
}

// For backward compatibility
export const calculateStudentLoanRepayment = calculateStudentLoan;
