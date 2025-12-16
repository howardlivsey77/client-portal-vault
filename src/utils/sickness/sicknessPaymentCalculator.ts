import { SicknessRecord, SicknessEntitlementSummary } from "@/types";
import { EligibilityRule } from "@/components/employees/details/work-pattern/types";
import { calculationUtils } from "@/services/employees/sickness/calculationUtils";
import { convertEntitlementToDays } from "@/components/employees/details/sickness/utils/workPatternCalculations";

export interface SicknessRecordPayment {
  recordId: string;
  fullPayDays: number;
  halfPayDays: number;
  noPayDays: number;
  isHistorical: boolean;
  paymentDescription: string;
}

/**
 * Check if a date falls within the current calendar month
 */
const isInCurrentMonth = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date.getMonth() === now.getMonth() && 
         date.getFullYear() === now.getFullYear();
};

/**
 * Check if two sickness absences are continuous (no gap between them)
 * Returns true if currentStartDate is exactly the day after previousEndDate
 */
const isContinuousAbsence = (
  previousEndDate: string | null,
  currentStartDate: string
): boolean => {
  if (!previousEndDate) return false;
  
  const prevEnd = new Date(previousEndDate);
  const currStart = new Date(currentStartDate);
  
  // Add 1 day to previous end date
  const expectedNextDay = new Date(prevEnd);
  expectedNextDay.setDate(expectedNextDay.getDate() + 1);
  
  // Check if current start is exactly the next day
  return expectedNextDay.toDateString() === currStart.toDateString();
};

/**
 * Calculate entitlement days from a rule based on working days per week
 */
const calculateEntitlementFromRule = (
  rule: EligibilityRule,
  workingDaysPerWeek: number = 5
): { fullPayDays: number; halfPayDays: number; hasWaitingDays: boolean } => {
  const fullPayDays = convertEntitlementToDays(rule.fullPayAmount, rule.fullPayUnit, workingDaysPerWeek);
  const halfPayDays = convertEntitlementToDays(rule.halfPayAmount, rule.halfPayUnit, workingDaysPerWeek);
  return { 
    fullPayDays, 
    halfPayDays,
    hasWaitingDays: rule.hasWaitingDays || false
  };
};

export interface HistoricalEntitlementOptions {
  hireDate?: string;
  eligibilityRules?: EligibilityRule[] | null;
  workingDaysPerWeek?: number;
}

/**
 * Calculate payment allocation for each sickness record based on entitlement usage.
 * When hireDate and eligibilityRules are provided, calculates entitlement at the time of each event.
 */
export const calculateSicknessRecordPayments = (
  sicknessRecords: SicknessRecord[],
  entitlementSummary: SicknessEntitlementSummary | null,
  options?: HistoricalEntitlementOptions
): SicknessRecordPayment[] => {
  const { hireDate, eligibilityRules, workingDaysPerWeek = 5 } = options || {};
  
  if (!entitlementSummary) {
    // If no entitlement summary, mark all as unknown
    return sicknessRecords.map(record => ({
      recordId: record.id,
      fullPayDays: 0,
      halfPayDays: 0,
      noPayDays: record.total_days,
      isHistorical: false,
      paymentDescription: "Unknown"
    }));
  }

  // Filter records within the current entitlement period
  const rangeStart = new Date(entitlementSummary.rolling_period_start);
  const rangeEnd = new Date(entitlementSummary.rolling_period_end);
  
  const recordsWithPeriodInfo = sicknessRecords.map(record => {
    const recordStart = new Date(record.start_date);
    const recordEnd = new Date(record.end_date || record.start_date);
    const isWithinPeriod = recordStart <= rangeEnd && recordEnd >= rangeStart;
    
    return {
      record,
      isWithinPeriod,
      sortDate: recordStart
    };
  });

  // Sort by start date to apply allocation chronologically
  recordsWithPeriodInfo.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

  // Determine if we can use historical entitlement calculation
  const useHistoricalEntitlement = Boolean(hireDate && eligibilityRules?.length);

  // Default entitlement from summary (used when no historical rules available)
  const defaultTotalFullPayDays = entitlementSummary.full_pay_used_rolling_12_months + entitlementSummary.full_pay_remaining;
  const defaultTotalHalfPayDays = entitlementSummary.half_pay_used_rolling_12_months + entitlementSummary.half_pay_remaining;
  const defaultHasWaitingDays = entitlementSummary.hasWaitingDays || false;

  // Track usage chronologically from zero
  let usedFullPay = 0;
  let usedHalfPay = 0;

  const results: SicknessRecordPayment[] = [];
  const waitingDaysCount = 3; // Standard 3 working day wait

  // Track previous record's end date to detect continuous absences
  let previousEndDate: string | null = null;

  for (const { record, isWithinPeriod } of recordsWithPeriodInfo) {
    if (!isWithinPeriod) {
      // Historical record - outside current entitlement period
      results.push({
        recordId: record.id,
        fullPayDays: 0,
        halfPayDays: 0,
        noPayDays: record.total_days,
        isHistorical: true,
        paymentDescription: "Historical"
      });
      // Still update previousEndDate for linking purposes
      previousEndDate = record.end_date || record.start_date;
      continue;
    }

    // Calculate entitlement for THIS record based on service at the time
    let totalFullPayDays = defaultTotalFullPayDays;
    let totalHalfPayDays = defaultTotalHalfPayDays;
    let hasWaitingDays = defaultHasWaitingDays;

    // Only apply historical entitlement for records outside the current month
    // (e.g., November sickness entered in December should use November's service months)
    const isHistoricalRecord = !isInCurrentMonth(record.start_date);
    
    if (useHistoricalEntitlement && isHistoricalRecord && hireDate && eligibilityRules) {
      // Calculate service months at the time of this sickness event
      const serviceMonthsAtEvent = calculationUtils.calculateServiceMonthsAtDate(hireDate, record.start_date);
      
      // Find the applicable rule for this service period
      const applicableRule = calculationUtils.findApplicableRule(serviceMonthsAtEvent, eligibilityRules);
      
      if (applicableRule) {
        const entitlementAtEvent = calculateEntitlementFromRule(applicableRule, workingDaysPerWeek);
        totalFullPayDays = entitlementAtEvent.fullPayDays;
        totalHalfPayDays = entitlementAtEvent.halfPayDays;
        hasWaitingDays = entitlementAtEvent.hasWaitingDays;
      }
    }
    // For current month records, use default (today's) entitlement

    let fullPayDays = 0;
    let halfPayDays = 0;
    let noPayDays = 0;
    let waitingDays = 0;
    let remainingDays = record.total_days;

    // Check if this absence is continuous with the previous one (no gap)
    const isContinuous = isContinuousAbsence(previousEndDate, record.start_date);

    // Apply waiting days only if enabled AND there's a gap (not continuous)
    if (hasWaitingDays && remainingDays > 0 && !isContinuous) {
      waitingDays = Math.min(remainingDays, waitingDaysCount);
      remainingDays -= waitingDays;
    }

    // Update previous end date for next iteration
    previousEndDate = record.end_date || record.start_date;

    // Calculate available entitlement for this record
    const availableFullPay = Math.max(0, totalFullPayDays - usedFullPay);
    const availableHalfPay = Math.max(0, totalHalfPayDays - usedHalfPay);

    // Allocate to full pay first
    if (remainingDays > 0 && availableFullPay > 0) {
      const allocateToFullPay = Math.min(remainingDays, availableFullPay);
      fullPayDays = allocateToFullPay;
      remainingDays -= allocateToFullPay;
      usedFullPay += allocateToFullPay;
    }

    // Then allocate to half pay
    if (remainingDays > 0 && availableHalfPay > 0) {
      const allocateToHalfPay = Math.min(remainingDays, availableHalfPay);
      halfPayDays = allocateToHalfPay;
      remainingDays -= allocateToHalfPay;
      usedHalfPay += allocateToHalfPay;
    }

    // Remaining days (including waiting days) are no pay
    noPayDays = remainingDays + waitingDays;

    // Generate payment description
    let paymentDescription = "";
    const paymentParts: string[] = [];

    if (fullPayDays > 0) {
      paymentParts.push(`${fullPayDays} day${fullPayDays > 1 ? 's' : ''} Full`);
    }
    if (halfPayDays > 0) {
      paymentParts.push(`${halfPayDays} day${halfPayDays > 1 ? 's' : ''} Half`);
    }
    if (noPayDays > 0) {
      paymentParts.push(`${noPayDays} day${noPayDays > 1 ? 's' : ''} No Pay`);
    }

    if (paymentParts.length === 0) {
      paymentDescription = "No Days";
    } else if (paymentParts.length === 1) {
      // Simplify single payment type descriptions
      if (fullPayDays === record.total_days) {
        paymentDescription = "Full Pay";
      } else if (halfPayDays === record.total_days) {
        paymentDescription = "Half Pay";
      } else if (noPayDays === record.total_days) {
        paymentDescription = "No Pay";
      } else {
        paymentDescription = paymentParts[0];
      }
    } else {
      paymentDescription = paymentParts.join(', ');
    }

    results.push({
      recordId: record.id,
      fullPayDays,
      halfPayDays,
      noPayDays,
      isHistorical: false,
      paymentDescription
    });
  }

  // Return results in original order
  return sicknessRecords.map(record => 
    results.find(result => result.recordId === record.id)!
  );
};