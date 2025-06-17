
import { WorkDay } from "@/components/employees/details/work-pattern/types";
import { defaultWorkPattern } from "@/types/employee";
import { extractWorkPatternWithPayrollId } from "@/components/employees/import/ImportUtils";
import { normalizePayrollId } from "./payrollIdUtils";

/**
 * Prepares work patterns for an employee with the correct payroll ID
 */
export const prepareWorkPatterns = (employeeData: any): WorkDay[] => {
  const payrollId = normalizePayrollId(employeeData.payroll_id);
  
  // Start with default work patterns
  let workPatterns: WorkDay[] = defaultWorkPattern.map(pattern => ({
    ...pattern,
    payrollId: payrollId
  }));
  
  // Override with extracted patterns if available
  const extractedPatterns = extractWorkPatternWithPayrollId(employeeData);
  if (extractedPatterns) {
    workPatterns = extractedPatterns;
  }
  
  return workPatterns;
};

/**
 * Converts work patterns to database insert format
 */
export const prepareWorkPatternsForInsert = (workPatterns: WorkDay[], employeeId: string, payrollId: string | null) => {
  return workPatterns.map(pattern => ({
    employee_id: employeeId,
    day: pattern.day,
    is_working: pattern.isWorking,
    start_time: pattern.startTime,
    end_time: pattern.endTime,
    payroll_id: payrollId
  }));
};
