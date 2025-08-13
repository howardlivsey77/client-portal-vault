

import { calculationUtils } from "./sickness/calculationUtils";
import { entitlementService } from "./sickness/entitlementService";
import { recordsService } from "./sickness/recordsService";
import { balanceService } from "./sickness/balanceService";
import { sspService } from "./sickness/sspService";

export const sicknessService = {
  // Calculation utilities
  getRolling12MonthPeriod: calculationUtils.getRolling12MonthPeriod,
  calculateServiceMonths: calculationUtils.calculateServiceMonths,
  findApplicableRule: calculationUtils.findApplicableRule,
  calculateEntitlements: calculationUtils.calculateEntitlements,

  // SSP calculations
  calculateSspUsage: sspService.calculateSspUsage,

  // Entitlement management
  getEntitlementUsage: entitlementService.getEntitlementUsage,
  recalculateExistingEntitlement: entitlementService.recalculateExistingEntitlement,
  createOrUpdateEntitlementUsage: entitlementService.createOrUpdateEntitlementUsage,
  setOpeningBalance: entitlementService.setOpeningBalance,
  updateUsedDays: entitlementService.updateUsedDays,
  syncAllEmployeeEntitlements: entitlementService.syncAllEmployeeEntitlements,
  recalculateAllUsedDays: entitlementService.recalculateAllUsedDays,
  recalculateEmployeeUsedDays: entitlementService.recalculateEmployeeUsedDays,

  // Sickness records management
  getSicknessRecords: recordsService.getSicknessRecords,
  recordSicknessAbsence: recordsService.recordSicknessAbsence,
  updateSicknessRecord: recordsService.updateSicknessRecord,
  deleteSicknessRecord: recordsService.deleteSicknessRecord,

  // Balance calculations
  getHistoricalBalances: balanceService.getHistoricalBalances,
  calculateRolling12MonthUsage: balanceService.calculateRolling12MonthUsage,
  calculateUsedDays: balanceService.calculateUsedDays
};
