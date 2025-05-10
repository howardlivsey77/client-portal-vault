
import { roundToTwoDecimals } from "@/lib/formatters";

/**
 * Calculate student loan repayments
 */
export function calculateStudentLoan(monthlySalary: number, planType: 1 | 2 | 4 | 5 | null): number {
  if (!planType) return 0;
  
  const annualSalary = monthlySalary * 12;
  let threshold, rate;
  
  switch (planType) {
    case 1:
      threshold = 22015; // Plan 1 threshold
      rate = 0.09;
      break;
    case 2:
      threshold = 27295; // Plan 2 threshold
      rate = 0.09;
      break;
    case 4:
      threshold = 27660; // Plan 4 threshold
      rate = 0.09;
      break;
    case 5:
      threshold = 25000; // Plan 5 threshold
      rate = 0.09;
      break;
    default:
      return 0;
  }
  
  if (annualSalary <= threshold) return 0;
  
  const monthlyRepayment = ((annualSalary - threshold) / 12) * rate;
  return roundToTwoDecimals(monthlyRepayment);
}
