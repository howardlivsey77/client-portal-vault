/**
 * Student Loan Repayment Calculator
 *
 * REGULATORY BASIS:
 * Per HMRC Student Loan guidance for software developers 2025-2026:
 * Loan deductions are calculated as a percentage of employee earnings
 * that are subject to Class 1 National Insurance contributions (E)
 * above an earnings threshold.
 *
 * ROUNDING: Loan deductions are rounded DOWN to the nearest pound per HMRC spec.
 * This differs from standard payroll rounding (2dp) — see section 3 of the spec.
 *
 * PGL (Postgraduate Loan) can run alongside one plan type (1, 2, or 4).
 * Plan 5 does not exist in HMRC guidance and has been removed.
 *
 * References:
 * - HMRC PAYE Manual: https://www.gov.uk/guidance/paye-collection-of-student-loans
 * - HMRC Student Loan guidance for software developers 2025-2026
 */
import { STUDENT_LOAN_THRESHOLDS } from "../constants/tax-constants";
import { payrollLogger } from "../utils/payrollLogger";

/**
 * Calculate student loan repayments using HMRC monthly thresholds
 *
 * @param niableGrossPay - NI-able gross pay (gross pay excluding non-NI-able reimbursements)
 * @param planType - The student loan plan type (1, 2, 4, 'PGL', or null)
 * @returns Monthly student loan repayment amount, rounded DOWN to nearest pound per HMRC spec
 */
export function calculateStudentLoan(
  niableGrossPay: number,
  planType: 1 | 2 | 4 | 'PGL' | null
): number {
  if (!planType) return 0;

  if (!Number.isFinite(niableGrossPay) || niableGrossPay < 0) {
    return 0;
  }

  let monthlyThreshold!: number;
  let rate!: number;

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
    case 'PGL':
      monthlyThreshold = STUDENT_LOAN_THRESHOLDS.PGL.monthly;
      rate = STUDENT_LOAN_THRESHOLDS.PGL.rate;
      break;
  }

  payrollLogger.debug('Student loan parameters', {
    planType: String(planType),
    ratePercent: rate * 100,
  });

  if (niableGrossPay <= monthlyThreshold) {
    payrollLogger.debug('Student loan: below threshold', {
      planType,
      belowThreshold: true,
    });
    return 0;
  }

  // HMRC spec: round DOWN to nearest pound (not 2dp)
  const monthlyRepayment = Math.floor((niableGrossPay - monthlyThreshold) * rate);

  payrollLogger.calculation('Student loan result', {
    monthlyRepayment,
  });

  return monthlyRepayment;
}
