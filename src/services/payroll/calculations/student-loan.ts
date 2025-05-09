
import { roundToTwoDecimals } from "@/lib/formatters";
import { getHardcodedStudentLoanThresholds, getTaxConstantsByCategory } from "../utils/tax-constants-service";
import { StudentLoanCalculator, StudentLoanPlan, StudentLoanThresholds } from "./StudentLoanCalculator";

/**
 * Get student loan plan details from database or fallback to hardcoded values
 */
async function getStudentLoanPlans(): Promise<Record<number, { threshold: number; rate: number }>> {
  try {
    const constants = await getTaxConstantsByCategory('STUDENT_LOAN');
    
    // Convert database constants to the student loan plan format
    const plans: Record<number, { threshold: number; rate: number }> = {};
    
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
 * Convert plans data to format required by StudentLoanCalculator
 */
function convertToCalculatorThresholds(plans: Record<number, { threshold: number; rate: number }>): 
  Record<StudentLoanPlan, StudentLoanThresholds> {
  const result: Record<StudentLoanPlan, StudentLoanThresholds> = {} as Record<StudentLoanPlan, StudentLoanThresholds>;
  
  // Convert each plan's monthly threshold to annual in pence
  Object.entries(plans).forEach(([planKey, planValue]) => {
    const plan = parseInt(planKey) as StudentLoanPlan;
    // Only include valid plan types
    if (plan === 1 || plan === 2 || plan === 3 || plan === 4 || plan === 5) {
      result[plan] = {
        annualThreshold: Math.round(planValue.threshold * 12 * 100), // Monthly to annual, pounds to pence
        repaymentRate: planValue.rate
      };
    }
  });
  
  return result;
}

/**
 * Calculate student loan repayments
 */
export async function calculateStudentLoan(monthlySalary: number, planType: 1 | 2 | 4 | 5 | null): Promise<number> {
  if (!planType) return 0;
  
  const plans = await getStudentLoanPlans();
  
  // If plan not found, return 0
  if (!plans[planType]) return 0;
  
  const thresholds = convertToCalculatorThresholds(plans);
  
  const result = StudentLoanCalculator.calculate({
    grossIncome: Math.round(monthlySalary * 100), // Convert to pence
    plan: planType as StudentLoanPlan,
    thresholds
  });
  
  // Convert result back to pounds
  return roundToTwoDecimals(result.repaymentAmount / 100);
}

/**
 * Synchronous version using hardcoded values for compatibility
 */
export function calculateStudentLoanSync(monthlySalary: number, planType: 1 | 2 | 4 | 5 | null): number {
  if (!planType) return 0;
  
  const hardcoded = getHardcodedStudentLoanThresholds();
  
  // If plan not found, return 0
  if (!hardcoded[planType]) return 0;
  
  const thresholds: Record<StudentLoanPlan, StudentLoanThresholds> = {} as Record<StudentLoanPlan, StudentLoanThresholds>;
  
  // Convert hardcoded thresholds to calculator format
  Object.entries(hardcoded).forEach(([planKey, planValue]) => {
    const plan = parseInt(planKey);
    if (plan === 1 || plan === 2 || plan === 3 || plan === 4 || plan === 5) {
      thresholds[plan as StudentLoanPlan] = {
        annualThreshold: Math.round(planValue.monthly * 12 * 100), // Convert monthly to annual and pounds to pence
        repaymentRate: planValue.rate
      };
    }
  });
  
  const result = StudentLoanCalculator.calculate({
    grossIncome: Math.round(monthlySalary * 100), // Convert to pence
    plan: planType as StudentLoanPlan,
    thresholds
  });
  
  // Convert result back to pounds
  return roundToTwoDecimals(result.repaymentAmount / 100);
}
