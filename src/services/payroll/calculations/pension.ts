
import { roundToTwoDecimals } from "@/lib/formatters";

/**
 * Calculate pension contribution
 */
export function calculatePension(monthlySalary: number, pensionPercentage: number): number {
  if (pensionPercentage <= 0) return 0;
  return roundToTwoDecimals(monthlySalary * (pensionPercentage / 100));
}
