import { calculationUtils } from "./calculationUtils";
import { entitlementService } from "./entitlementService";
import { recordsService } from "./recordsService";
import { balanceService } from "./balanceService";
import { sspService } from "./sspService";

// Consolidated facade over all sickness-related services.
// This class simply delegates to existing services to avoid any behavior change.
// You can later extend this with logging, caching, or DI without touching consumers.
export class SicknessService {
  // Calculation utilities
  getRolling12MonthPeriod = calculationUtils.getRolling12MonthPeriod;
  getActualRollingPeriod = calculationUtils.getActualRollingPeriod;
  calculateServiceMonths = calculationUtils.calculateServiceMonths;
  findApplicableRule = calculationUtils.findApplicableRule;
  calculateEntitlements = calculationUtils.calculateEntitlements;

  // SSP calculations
  calculateSspUsage = sspService.calculateSspUsage;

  // Entitlement management
  getEntitlementUsage = entitlementService.getEntitlementUsage;
  recalculateExistingEntitlement = entitlementService.recalculateExistingEntitlement;
  createOrUpdateEntitlementUsage = entitlementService.createOrUpdateEntitlementUsage;
  updateUsedDays = entitlementService.updateUsedDays;
  syncAllEmployeeEntitlements = entitlementService.syncAllEmployeeEntitlements;
  recalculateAllUsedDays = entitlementService.recalculateAllUsedDays;
  recalculateEmployeeUsedDays = entitlementService.recalculateEmployeeUsedDays;

  // Sickness records management
  getSicknessRecords = recordsService.getSicknessRecords;
  recordSicknessAbsence = recordsService.recordSicknessAbsence;
  updateSicknessRecord = recordsService.updateSicknessRecord;
  deleteSicknessRecord = recordsService.deleteSicknessRecord;
  recalculateEntitlementWithReference = recordsService.recalculateEntitlementWithReference;

  // Balance calculations
  getHistoricalBalances = balanceService.getHistoricalBalances;
  calculateRolling12MonthUsage = balanceService.calculateRolling12MonthUsage;
  calculateUsedDays = balanceService.calculateUsedDays;

  // New reference date aware methods
  async calculateRolling12MonthUsageFromDate(employeeId: string, referenceDate: string | Date) {
    return balanceService.calculateRolling12MonthUsage(employeeId, referenceDate);
  }

  async calculateSspUsageFromDate(employeeId: string, referenceDate: string | Date) {
    return sspService.calculateSspUsage(employeeId, referenceDate);
  }
}

// Pre-instantiated service instance
export const sicknessService = new SicknessService();
