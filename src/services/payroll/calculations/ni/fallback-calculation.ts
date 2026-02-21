import { NICalculationResult } from "./types";
import { NI_THRESHOLDS, NI_CATEGORY_RATES, NI_EMPLOYEE_RATES, NI_EMPLOYER_RATES, NI_UPPER_SECONDARY_THRESHOLD } from "../../constants/tax-constants";
import type { NICategory } from "../../constants/tax-constants";
import { calculateNICEarningsBands } from "./earnings-bands";
import { payrollLogger } from "@/services/payroll/utils/payrollLogger";

/**
 * Fallback calculation using constants when database values are not available.
 * Supports all NI categories (A, B, C, M, H, Z, J, V) via rate group lookup.
 */
export function calculateNationalInsuranceFallback(
  monthlySalary: number,
  niCategory: NICategory = 'A'
): NICalculationResult {
  payrollLogger.debug('Using fallback NI calculation', {
    hasSalary: monthlySalary > 0,
    niCategory,
  }, 'NI_CALC');

  const primaryThreshold = NI_THRESHOLDS.PRIMARY_THRESHOLD.monthly;
  const lowerEarningsLimit = NI_THRESHOLDS.LOWER_EARNINGS_LIMIT.monthly;
  const upperLimit = NI_THRESHOLDS.UPPER_EARNINGS_LIMIT.monthly;
  const secondaryThreshold = NI_THRESHOLDS.SECONDARY_THRESHOLD.monthly;

  const result: NICalculationResult = {
    nationalInsurance: 0,
    employerNationalInsurance: 0,
    earningsAtLEL: 0,
    earningsLELtoPT: 0,
    earningsPTtoUEL: 0,
    earningsAboveUEL: 0,
    earningsAboveST: 0
  };

  const earningsBands = calculateNICEarningsBands(
    monthlySalary,
    lowerEarningsLimit,
    primaryThreshold,
    upperLimit,
    secondaryThreshold
  );

  result.earningsAtLEL = earningsBands.earningsAtLEL;
  result.earningsLELtoPT = earningsBands.earningsLELtoPT;
  result.earningsPTtoUEL = earningsBands.earningsPTtoUEL;
  result.earningsAboveUEL = earningsBands.earningsAboveUEL;
  result.earningsAboveST = earningsBands.earningsAboveST;

  // Look up rates for this category
  const categoryRates = NI_CATEGORY_RATES[niCategory];
  const employeeRates = NI_EMPLOYEE_RATES[categoryRates.employeeRateGroup];

  // Employee NI: PT to UEL × mainRate
  if (result.earningsPTtoUEL > 0) {
    result.nationalInsurance += result.earningsPTtoUEL * employeeRates.mainRate;
  }

  // Employee NI: above UEL × additionalRate
  if (result.earningsAboveUEL > 0) {
    result.nationalInsurance += result.earningsAboveUEL * employeeRates.additionalRate;
  }

  // Employer NI — depends on rate group
  if (categoryRates.employerRateGroup === 'ZERO_TO_SECONDARY_THRESHOLD') {
    // Categories M, H, V, Z: 0% employer NI up to UST/AUST/VUST, then 15% above
    const earningsAboveUST = Math.max(0, monthlySalary - NI_UPPER_SECONDARY_THRESHOLD.monthly);
    result.employerNationalInsurance = earningsAboveUST * NI_EMPLOYER_RATES.STANDARD_RATE;
  } else {
    // Categories A, B, C, J: Standard 15% employer NI on all earnings above ST
    if (result.earningsAboveST > 0) {
      result.employerNationalInsurance = result.earningsAboveST * NI_EMPLOYER_RATES.STANDARD_RATE;
    }
  }

  return result;
}
