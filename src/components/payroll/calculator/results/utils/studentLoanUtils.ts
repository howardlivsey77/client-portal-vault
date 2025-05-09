
/**
 * Maps student loan plan numbers to descriptive text
 */
export function getStudentLoanPlanName(plan: number | null): string {
  if (!plan) return "None";
  const planMap: Record<number, string> = {
    1: "Plan 1",
    2: "Plan 2",
    4: "Plan 4",
    5: "Plan 5"
  };
  return planMap[plan] || `Plan ${plan}`;
}
