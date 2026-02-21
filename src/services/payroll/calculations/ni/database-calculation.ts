import { roundToTwoDecimals } from "@/lib/formatters";
import { NICalculationResult, NICBand } from "./types";
import { calculateNICEarningsBands } from "./earnings-bands";
import { NI_CATEGORY_RATES, NI_EMPLOYEE_RATES, NI_EMPLOYER_RATES, NI_UPPER_SECONDARY_THRESHOLD } from "../../constants/tax-constants";
import type { NICategory } from "../../constants/tax-constants";
import { payrollLogger } from "@/services/payroll/utils/payrollLogger";

/**
 * Calculate NI bands and contributions based on database bands
 *
 * Supports all NI categories (A, B, C, M, H, Z, J, V) via rate group lookup.
 */
export function calculateFromBands(
  monthlySalary: number,
  niBands: NICBand[],
  niCategory: NICategory = 'A'
): NICalculationResult | null {
  payrollLogger.debug('Using NI bands from database', { bandsCount: niBands.length, niCategory }, 'NI_CALC');

  const result: NICalculationResult = {
    nationalInsurance: 0,
    employerNationalInsurance: 0,
    earningsAtLEL: 0,
    earningsLELtoPT: 0,
    earningsPTtoUEL: 0,
    earningsAboveUEL: 0,
    earningsAboveST: 0
  };

  const employeeBands = niBands.filter(band => band.contribution_type === 'Employee');

  const lelBand = employeeBands.find(band => band.name.includes('LEL') && !band.name.includes('to'));
  const lelToPTBand = employeeBands.find(band => band.name.includes('LEL to PT'));
  const ptToUELBand = employeeBands.find(band => band.name.includes('PT to UEL'));
  const aboveUELBand = employeeBands.find(band => band.name.includes('Above UEL'));

  if (lelBand && lelToPTBand && ptToUELBand && aboveUELBand) {
    const lel = lelBand.threshold_to ? lelBand.threshold_to / 100 : 542;
    const pt = lelToPTBand.threshold_to ? lelToPTBand.threshold_to / 100 :
               (ptToUELBand.threshold_from ? ptToUELBand.threshold_from / 100 : 1048);
    const uel = ptToUELBand.threshold_to ? ptToUELBand.threshold_to / 100 :
                (aboveUELBand.threshold_from ? aboveUELBand.threshold_from / 100 : 4189);

    const employerBands = niBands.filter(band => band.contribution_type === 'Employer');
    const stBand = employerBands.find(band => band.name.includes('Above ST'));
    const st = stBand ? stBand.threshold_from / 100 : 417;

    const earningsBands = calculateNICEarningsBands(monthlySalary, lel, pt, uel, st);

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
      // For 2025/26 UST = UEL, so only earnings above UEL attract employer NI
      const earningsAboveUST = Math.max(0, monthlySalary - NI_UPPER_SECONDARY_THRESHOLD.monthly);
      result.employerNationalInsurance = earningsAboveUST * NI_EMPLOYER_RATES.STANDARD_RATE;
    } else {
      // Categories A, B, C, J: Standard 15% employer NI on all earnings above ST
      if (result.earningsAboveST > 0) {
        result.employerNationalInsurance = result.earningsAboveST * NI_EMPLOYER_RATES.STANDARD_RATE;
      }
    }

    payrollLogger.debug('NI calculation complete', {
      niCategory,
      rateGroup: categoryRates.employeeRateGroup,
      hasPTtoUEL: result.earningsPTtoUEL > 0,
      hasAboveUEL: result.earningsAboveUEL > 0,
    }, 'NI_CALC');
  } else {
    payrollLogger.debug('Missing required NI bands, returning null', {
      hasLEL: !!lelBand,
      hasLELtoPT: !!lelToPTBand,
      hasPTtoUEL: !!ptToUELBand,
      hasAboveUEL: !!aboveUELBand,
    }, 'NI_CALC');
    return null;
  }

  result.nationalInsurance = roundToTwoDecimals(result.nationalInsurance);
  return result;
}
