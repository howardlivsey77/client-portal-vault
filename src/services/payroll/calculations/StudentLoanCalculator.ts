
export type StudentLoanPlan = 1 | 2 | 3 | 4 | 5; // Plan 3 is for postgraduate loans, Plan 5 also supported

export interface StudentLoanThresholds {
  annualThreshold: number;  // in pence
  repaymentRate: number;    // e.g., 0.09 for 9%
}

export interface StudentLoanParams {
  grossIncome: number;          // Income subject to student loan in pence
  plan: StudentLoanPlan;
  thresholds: Record<StudentLoanPlan, StudentLoanThresholds>;
}

export interface StudentLoanResult {
  plan: StudentLoanPlan;
  repaymentAmount: number; // in pence
}

export class StudentLoanCalculator {
  static calculate({ grossIncome, plan, thresholds }: StudentLoanParams): StudentLoanResult {
    const thresholdInfo = thresholds[plan];
    if (!thresholdInfo) {
      throw new Error(`Thresholds not defined for Student Loan Plan ${plan}`);
    }

    const { annualThreshold, repaymentRate } = thresholdInfo;
    const monthlyThreshold = Math.floor(annualThreshold / 12);

    const excess = grossIncome - monthlyThreshold;
    const repayment = excess > 0 ? Math.floor(excess * repaymentRate) : 0;

    return {
      plan,
      repaymentAmount: repayment,
    };
  }
}
