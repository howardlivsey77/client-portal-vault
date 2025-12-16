import { calculationUtils } from "./calculationUtils";
import { entitlementService } from "./entitlementService";
import { recordsService } from "./recordsService";
import { balanceService } from "./balanceService";
import { sspService } from "./sspService";

// Consolidated facade over all sickness-related services.
// This class simply delegates to existing services to avoid any behavior change.
// You can later extend this with logging, caching, or DI without touching consumers.
export class SicknessService {
  // Calculation utilities - bind to preserve 'this' context
  getRolling12MonthPeriod = calculationUtils.getRolling12MonthPeriod.bind(calculationUtils);
  getActualRollingPeriod = calculationUtils.getActualRollingPeriod.bind(calculationUtils);
  calculateServiceMonths = calculationUtils.calculateServiceMonths.bind(calculationUtils);
  findApplicableRule = calculationUtils.findApplicableRule.bind(calculationUtils);
  calculateEntitlements = calculationUtils.calculateEntitlements.bind(calculationUtils);

  // SSP calculations
  calculateSspUsage = sspService.calculateSspUsage.bind(sspService);

  // Entitlement management
  getEntitlementUsage = entitlementService.getEntitlementUsage.bind(entitlementService);
  recalculateExistingEntitlement = entitlementService.recalculateExistingEntitlement.bind(entitlementService);
  createOrUpdateEntitlementUsage = entitlementService.createOrUpdateEntitlementUsage.bind(entitlementService);
  updateUsedDays = entitlementService.updateUsedDays.bind(entitlementService);
  syncAllEmployeeEntitlements = entitlementService.syncAllEmployeeEntitlements.bind(entitlementService);
  recalculateAllUsedDays = entitlementService.recalculateAllUsedDays.bind(entitlementService);
  recalculateEmployeeUsedDays = entitlementService.recalculateEmployeeUsedDays.bind(entitlementService);

  // Sickness records management
  getSicknessRecords = recordsService.getSicknessRecords.bind(recordsService);
  recordSicknessAbsence = recordsService.recordSicknessAbsence.bind(recordsService);
  updateSicknessRecord = recordsService.updateSicknessRecord.bind(recordsService);
  deleteSicknessRecord = recordsService.deleteSicknessRecord.bind(recordsService);
  recalculateEntitlementWithReference = recordsService.recalculateEntitlementWithReference.bind(recordsService);

  // Balance calculations
  getHistoricalBalances = balanceService.getHistoricalBalances.bind(balanceService);
  calculateRolling12MonthUsage = balanceService.calculateRolling12MonthUsage.bind(balanceService);
  calculateUsedDays = balanceService.calculateUsedDays.bind(balanceService);

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
