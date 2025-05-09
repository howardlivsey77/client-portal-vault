
import { roundToTwoDecimals } from "@/lib/formatters";

/**
 * Calculate pension contribution based on gross salary and percentage
 * @param grossSalary Gross salary or pay
 * @param pensionPercentage Pension contribution percentage
 * @returns Pension contribution amount
 */
export function calculatePension(
  grossSalary: number, 
  pensionPercentage: number = 0
): number {
  if (!pensionPercentage || pensionPercentage <= 0) {
    return 0;
  }
  
  const contribution = (grossSalary * pensionPercentage) / 100;
  return roundToTwoDecimals(contribution);
}
