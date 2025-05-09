
import { roundToTwoDecimals } from "@/lib/formatters";
import { getHardcodedStudentLoanThresholds, getTaxConstantsByCategory } from "../utils/tax-constants-service";

interface StudentLoanPlanInfo {
  threshold: number;
  rate: number;
}

/**
 * Get student loan plan details from database or fallback to hardcoded values
 */
async function getStudentLoanPlans(): Promise<Record<number, StudentLoanPlanInfo>> {
  try {
    const constants = await getTaxConstantsByCategory('STUDENT_LOAN');
    
    // Convert database constants to the student loan plan format
    const plans: Record<number, StudentLoanPlanInfo> = {};
    
    constants.forEach(constant => {
      const planMatch = constant.key.match(/PLAN_(\d+)_(THRESHOLD|RATE)/);
      if (planMatch && constant.value_numeric !== null) {
        const planNumber = parseInt(planMatch[1]);
        const property = planMatch[2].toLowerCase();
        
        if (!plans[planNumber]) {
          plans[planNumber] = {
            threshold: 0,
            rate: 0
          };
        }
        
        if (property === 'threshold') {
          plans[planNumber].threshold = constant.value_numeric;
        } else if (property === 'rate') {
          plans[planNumber].rate = constant.value_numeric;
        }
      }
    });
    
    return plans;
  } catch (error) {
    console.error("Error fetching student loan plans:", error);
    // Fallback to hardcoded values
    const hardcoded = getHardcodedStudentLoanThresholds();
    
    return {
      1: { threshold: hardcoded[1].monthly, rate: hardcoded[1].rate },
      2: { threshold: hardcoded[2].monthly, rate: hardcoded[2].rate },
      4: { threshold: hardcoded[4].monthly, rate: hardcoded[4].rate },
      5: { threshold: hardcoded[5].monthly, rate: hardcoded[5].rate },
    };
  }
}

/**
 * Calculate student loan repayments
 */
export async function calculateStudentLoan(monthlySalary: number, planType: 1 | 2 | 4 | 5 | null): Promise<number> {
  if (!planType) return 0;
  
  const plans = await getStudentLoanPlans();
  
  // If plan not found, return 0
  if (!plans[planType]) return 0;
  
  const { threshold, rate } = plans[planType];
  
  if (monthlySalary <= threshold) return 0;
  
  const monthlyRepayment = (monthlySalary - threshold) * rate;
  return roundToTwoDecimals(monthlyRepayment);
}

/**
 * Synchronous version using hardcoded values for compatibility
 */
export function calculateStudentLoanSync(monthlySalary: number, planType: 1 | 2 | 4 | 5 | null): number {
  if (!planType) return 0;
  
  const hardcoded = getHardcodedStudentLoanThresholds();
  
  // If plan not found, return 0
  if (!hardcoded[planType]) return 0;
  
  const { monthly: threshold, rate } = hardcoded[planType];
  
  if (monthlySalary <= threshold) return 0;
  
  const monthlyRepayment = (monthlySalary - threshold) * rate;
  return roundToTwoDecimals(monthlyRepayment);
}
