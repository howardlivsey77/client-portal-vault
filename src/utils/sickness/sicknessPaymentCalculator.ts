import { SicknessRecord, SicknessEntitlementSummary } from "@/types";

export interface SicknessRecordPayment {
  recordId: string;
  fullPayDays: number;
  halfPayDays: number;
  noPayDays: number;
  isHistorical: boolean;
  paymentDescription: string;
}

/**
 * Calculate payment allocation for each sickness record based on entitlement usage
 */
export const calculateSicknessRecordPayments = (
  sicknessRecords: SicknessRecord[],
  entitlementSummary: SicknessEntitlementSummary | null
): SicknessRecordPayment[] => {
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

  // Calculate total entitled days
  const totalFullPayDays = entitlementSummary.full_pay_used_rolling_12_months + entitlementSummary.full_pay_remaining;
  const totalHalfPayDays = entitlementSummary.half_pay_used_rolling_12_months + entitlementSummary.half_pay_remaining;

  // Track usage chronologically from zero
  let usedFullPay = 0;
  let usedHalfPay = 0;

  const results: SicknessRecordPayment[] = [];

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
      continue;
    }

    let fullPayDays = 0;
    let halfPayDays = 0;
    let noPayDays = 0;
    let remainingDays = record.total_days;

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

    // Remaining days are no pay
    noPayDays = remainingDays;

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