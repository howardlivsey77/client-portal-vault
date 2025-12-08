import { Employee } from "@/types/employee-types";
import { SicknessEntitlementSummary } from "@/types/sickness";
import { sicknessService } from "@/services";
import { formatEntitlementTier } from "@/utils/common/formatters";

/**
 * Shared utility to calculate sickness entitlement summary from raw data
 * This ensures consistency between individual employee pages and reports
 */
export const calculateSicknessEntitlementSummary = async (
  employee: Employee,
  referenceDate?: string | Date
): Promise<SicknessEntitlementSummary | null> => {
  try {
    // Get entitlement usage (this contains the entitled amounts and opening balances)
    const entitlementUsage = await sicknessService.getEntitlementUsage(employee.id);
    
    if (!entitlementUsage) {
      return null;
    }

    // Calculate real-time usage from actual sickness records
    const [yearUsage, rollingUsage, ssp] = await Promise.all([
      sicknessService.calculateUsedDays(employee.id),
      referenceDate 
        ? sicknessService.calculateRolling12MonthUsageFromDate(employee.id, referenceDate)
        : sicknessService.calculateRolling12MonthUsage(employee.id),
      referenceDate
        ? sicknessService.calculateSspUsageFromDate(employee.id, referenceDate)
        : sicknessService.calculateSspUsage(employee.id)
    ]);

    const rollingPeriod = await sicknessService.getActualRollingPeriod(employee.id, referenceDate);

    const fullAllowance = entitlementUsage.full_pay_entitled_days || 0;
    const halfAllowance = entitlementUsage.half_pay_entitled_days || 0;

    const rollingTotalUsed = rollingUsage.totalUsed || 0;

    // Allocate used days to full then half for display (OSP logic)
    const rollingFullUsed = Math.min(rollingTotalUsed, fullAllowance);
    const rollingRemainingAfterFull = Math.max(0, rollingTotalUsed - rollingFullUsed);
    const rollingHalfUsed = Math.min(rollingRemainingAfterFull, halfAllowance);

    return {
      full_pay_remaining: Math.max(0, fullAllowance - rollingFullUsed),
      half_pay_remaining: Math.max(0, halfAllowance - rollingHalfUsed),
      full_pay_used_rolling_12_months: rollingFullUsed,
      half_pay_used_rolling_12_months: rollingHalfUsed,
      total_used_rolling_12_months: rollingTotalUsed,
      current_tier: formatEntitlementTier(fullAllowance, halfAllowance),
      service_months: entitlementUsage.current_service_months,
      rolling_period_start: rollingPeriod.start,
      rolling_period_end: rollingPeriod.end,
      // SSP fields based on proper PIW/linking rules
      ssp_entitled_days: ssp.sspEntitledDays,
      ssp_used_rolling_12_months: ssp.sspUsedRolling12,
      ssp_remaining_days: Math.max(0, ssp.sspEntitledDays - ssp.sspUsedRolling12)
    };
  } catch (error) {
    console.error('Error calculating entitlement summary for employee:', employee.id, error);
    return null;
  }
};