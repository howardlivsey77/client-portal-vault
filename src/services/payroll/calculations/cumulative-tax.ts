
import { parseTaxCode, TaxRegion } from "../utils/tax-code-utils";
import { getIncomeTaxBands, calculateTaxByBands } from "../utils/tax-bands-utils";
import { 
  validateCumulativeInputs, 
  validateWeek1Month1Inputs 
} from "../validation/payroll-validators";
import { CalculationAnomalyError } from "../errors/payroll-errors";
import { payrollLogger } from "../utils/payrollLogger";

/**
 * =============================================================================
 * HMRC Cumulative & Week 1/Month 1 Tax Calculations
 * =============================================================================
 * 
 * Implements HMRC Specification for PAYE Tax Table Routines v23.0 (January 2025).
 * 
 * ROUNDING STRATEGY (HMRC-aligned):
 * ---------------------------------
 * 1. Free Pay YTD: Rounded to 2 decimal places using roundToTwoDecimals()
 * 2. Taxable Pay YTD: Rounded DOWN (floored) to nearest whole pound
 * 3. Tax Due YTD: Calculated at full precision using tax bands
 * 4. Tax This Period: Rounded to 2 decimal places at OUTPUT only
 * 
 * REGULATORY LIMIT:
 * Per HMRC spec para 4.5.2: tax deducted cannot exceed 50% of gross pay.
 * 
 * TAX REGIONS:
 * - England/NI: 3 bands (20%/40%/45%)
 * - Scotland: 6 bands (19%/20%/21%/42%/45%/48%)
 * - Wales: Same bands as England (20%/40%/45%) per Appendix C
 * 
 * TAX CODE HANDLING:
 * - Standard codes (1257L, etc.): positive monthlyFreePay
 * - K codes (K497, etc.): NEGATIVE monthlyFreePay (adds to taxable income)
 * - Special codes (BR, D0, D1): flat rate, zero free pay
 * - Scottish: SBR=20%, SD0=42%, SD1=45%, SD2=48%
 * - Welsh: CBR=20%, CD0=40%, CD1=45%
 * - Emergency code (0T): 0 allowance, banded calculation
 * - No Tax (NT): 0 tax, refunds any previously paid tax
 */

function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Scottish tax bands (2025/26)
// Source: HMRC spec Appendix B
// ---------------------------------------------------------------------------

const SCOTTISH_ANNUAL_BANDS_2025_26 = [
  { upTo: 2827,     rate: 0.19 },  // Starter rate
  { upTo: 14921,    rate: 0.20 },  // Basic rate
  { upTo: 31092,    rate: 0.21 },  // Intermediate rate
  { upTo: 62430,    rate: 0.42 },  // Higher rate
  { upTo: 125140,   rate: 0.45 },  // Advanced rate
  { upTo: Infinity, rate: 0.48 },  // Top rate
];

/**
 * Calculate tax using Scottish progressive bands
 */
function calculateScottishTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  
  let tax = 0;
  let previousUpTo = 0;
  
  for (const band of SCOTTISH_ANNUAL_BANDS_2025_26) {
    if (taxableIncome <= previousUpTo) break;
    const incomeInBand = Math.min(taxableIncome, band.upTo) - previousUpTo;
    tax += incomeInBand * band.rate;
    previousUpTo = band.upTo;
  }
  
  return tax;
}

/**
 * Calculate tax using Scottish monthly bands for W1/M1
 * Per HMRC spec Definition 10: monthly limits are annual ÷ 12 rounded UP (Cvalues)
 */
function calculateScottishMonthlyTax(taxablePayThisPeriod: number): number {
  if (taxablePayThisPeriod <= 0) return 0;
  
  let tax = 0;
  let previousLimit = 0;
  
  for (const band of SCOTTISH_ANNUAL_BANDS_2025_26) {
    const monthlyLimit = band.upTo === Infinity ? Infinity : Math.ceil(band.upTo / 12);
    if (taxablePayThisPeriod <= previousLimit) break;
    const incomeInBand = Math.min(taxablePayThisPeriod, monthlyLimit) - previousLimit;
    tax += incomeInBand * band.rate;
    previousLimit = monthlyLimit;
  }
  
  return tax;
}

// ---------------------------------------------------------------------------
// Flat-rate code resolution
// ---------------------------------------------------------------------------

interface FlatRateResult {
  rate: number;
  label: string;
}

/**
 * Resolve flat-rate codes (BR, D0, D1, SD0, SD1, SD2, CBR, CD0, CD1)
 * Returns the applicable flat tax rate, or null if not a flat-rate code.
 */
function resolveFlatRateCode(coreCode: string, taxRegion: TaxRegion): FlatRateResult | null {
  if (taxRegion === 'scotland') {
    switch (coreCode) {
      case 'BR': return { rate: 0.20, label: 'SBR' };
      case 'D0': return { rate: 0.42, label: 'SD0' };
      case 'D1': return { rate: 0.45, label: 'SD1' };
      case 'D2': return { rate: 0.48, label: 'SD2' };
    }
  }
  // Wales uses same rates as England
  switch (coreCode) {
    case 'BR': return { rate: 0.20, label: 'BR' };
    case 'D0': return { rate: 0.40, label: 'D0' };
    case 'D1': return { rate: 0.45, label: 'D1' };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Anomaly checking
// ---------------------------------------------------------------------------

interface AnomalyCheckOptions {
  taxCode?: string;
  isActualPeriodGross: boolean;
}

/**
 * Check for calculation anomalies.
 * Only flags warnings when tax is positive, gross is known, and not a flat-rate/K code.
 * Uses 50% threshold per HMRC spec para 4.5.2.
 */
function checkForAnomalies(
  taxThisPeriod: number,
  grossPayThisPeriod: number,
  context: string,
  options: AnomalyCheckOptions = { isActualPeriodGross: false }
): void {
  const upperTaxCode = options.taxCode?.toUpperCase() ?? '';
  const coreCode = upperTaxCode.replace(/^[SC]/, '');
  const isHighRateCode = ['BR', 'D0', 'D1', 'D2'].includes(coreCode);
  const isKCode = coreCode.startsWith('K');
  
  if (
    options.isActualPeriodGross &&
    !isHighRateCode &&
    !isKCode &&
    grossPayThisPeriod > 0 &&
    taxThisPeriod > 0 &&
    taxThisPeriod > grossPayThisPeriod * 0.5
  ) {
    payrollLogger.warn(
      `${context}: Tax (£${taxThisPeriod.toFixed(2)}) exceeds 50% of gross pay (£${grossPayThisPeriod.toFixed(2)}). Please verify.`,
      { employeeId: 'unknown' },
      'TAX_CALC'
    );
  }
  
  if (taxThisPeriod < -10000) {
    throw new CalculationAnomalyError(
      `Extremely large tax refund of £${Math.abs(taxThisPeriod).toFixed(2)} calculated. ` +
      `This exceeds safety threshold and requires manual review.`,
      { taxThisPeriod, grossPayThisPeriod, context }
    );
  }
}

// ---------------------------------------------------------------------------
// Cumulative tax calculation result
// ---------------------------------------------------------------------------

export interface CumulativeTaxResult {
  taxThisPeriod: number;
  taxDueYTD: number;
  freePayYTD: number;
  freePayMonthly: number;
  taxablePayYTD: number;
}

/**
 * Calculate cumulative tax for a given period using HMRC cumulative basis.
 * 
 * @param period - Tax period (1-12 for monthly)
 * @param grossPayYTD - Gross pay year to date including this period (in pounds)
 * @param taxCode - Employee tax code (e.g., '1257L', 'S1257L', 'C1257L', 'K497')
 * @param taxPaidYTD - Tax already paid YTD from previous periods (in pounds)
 * @param taxYear - Optional tax year for fetching correct tax bands
 * @param grossPayThisPeriod - Optional: gross pay this period for regulatory limit
 * @returns Tax calculation result including tax this period (can be negative for refunds)
 */
export async function calculateCumulativeTax(
  period: number,
  grossPayYTD: number,
  taxCode: string,
  taxPaidYTD: number,
  taxYear?: string,
  grossPayThisPeriod?: number
): Promise<CumulativeTaxResult> {
  const validated = validateCumulativeInputs(period, grossPayYTD, taxCode, taxPaidYTD);
  
  const taxCodeInfo = parseTaxCode(validated.taxCode);
  const { taxRegion } = taxCodeInfo;
  
  // Handle NT code
  if (validated.taxCode === 'NT' || validated.taxCode === 'SNT' || validated.taxCode === 'CNT') {
    return {
      taxThisPeriod: -validated.taxPaidYTD,
      taxDueYTD: 0,
      freePayYTD: Infinity,
      freePayMonthly: Infinity,
      taxablePayYTD: 0
    };
  }
  
  // Strip prefix to get core code for flat-rate check
  let coreCode = validated.taxCode;
  if (taxRegion === 'scotland' && coreCode.startsWith('S')) coreCode = coreCode.substring(1);
  else if (taxRegion === 'wales' && coreCode.startsWith('C')) coreCode = coreCode.substring(1);
  
  // Handle flat-rate codes
  const flatRate = resolveFlatRateCode(coreCode, taxRegion);
  if (flatRate) {
    const taxablePayYTD = Math.floor(validated.grossPayYTD);
    const taxDueYTD = taxablePayYTD * flatRate.rate;
    let taxThisPeriod = roundToTwoDecimals(taxDueYTD - validated.taxPaidYTD);
    
    // Apply 50% regulatory limit if period gross is known
    if (grossPayThisPeriod !== undefined && grossPayThisPeriod > 0) {
      const limit = Math.floor(grossPayThisPeriod * 0.5 * 100) / 100;
      taxThisPeriod = Math.min(taxThisPeriod, limit);
    }
    
    checkForAnomalies(taxThisPeriod, grossPayThisPeriod ?? (validated.grossPayYTD / validated.period), `${flatRate.label} cumulative`, {
      taxCode: validated.taxCode,
      isActualPeriodGross: grossPayThisPeriod !== undefined
    });
    return {
      taxThisPeriod,
      taxDueYTD: roundToTwoDecimals(taxDueYTD),
      freePayYTD: 0,
      freePayMonthly: 0,
      taxablePayYTD
    };
  }
  
  // Standard cumulative calculation
  const freePayMonthly = taxCodeInfo.monthlyFreePay;
  const freePayYTD = roundToTwoDecimals(freePayMonthly * validated.period);
  
  const rawTaxableYTD = Math.floor(validated.grossPayYTD - freePayYTD);
  const taxablePayYTD = taxCodeInfo.allowance >= 0 ? Math.max(0, rawTaxableYTD) : rawTaxableYTD;
  
  // Route to correct tax engine based on region
  let taxDueYTD: number;
  if (taxRegion === 'scotland') {
    taxDueYTD = calculateScottishTax(taxablePayYTD);
  } else {
    // England/NI and Wales use the same bands
    const taxBands = await getIncomeTaxBands(taxYear);
    taxDueYTD = calculateTaxByBands(taxablePayYTD, taxBands);
  }
  
  let taxThisPeriod = roundToTwoDecimals(taxDueYTD - validated.taxPaidYTD);
  
  // Apply 50% regulatory limit (HMRC spec para 4.5.2)
  if (grossPayThisPeriod !== undefined && grossPayThisPeriod > 0 && taxThisPeriod > 0) {
    const limit = Math.floor(grossPayThisPeriod * 0.5 * 100) / 100;
    taxThisPeriod = Math.min(taxThisPeriod, limit);
  }
  
  checkForAnomalies(taxThisPeriod, grossPayThisPeriod ?? 0, 'Cumulative calculation', {
    taxCode: validated.taxCode,
    isActualPeriodGross: grossPayThisPeriod !== undefined
  });
  
  return {
    taxThisPeriod,
    taxDueYTD: roundToTwoDecimals(taxDueYTD),
    freePayYTD,
    freePayMonthly,
    taxablePayYTD
  };
}

/**
 * @deprecated Use calculateCumulativeTax (async) for production payroll.
 * Retained for backward compatibility and testing.
 */
export function calculateCumulativeTaxSync(
  period: number,
  grossPayYTD: number,
  taxCode: string,
  taxPaidYTD: number
): CumulativeTaxResult {
  const validated = validateCumulativeInputs(period, grossPayYTD, taxCode, taxPaidYTD);
  
  const taxCodeInfo = parseTaxCode(validated.taxCode);
  
  if (validated.taxCode === 'NT') {
    return {
      taxThisPeriod: roundToTwoDecimals(-validated.taxPaidYTD),
      taxDueYTD: 0,
      freePayYTD: Infinity,
      freePayMonthly: Infinity,
      taxablePayYTD: 0
    };
  }
  
  // Flat-rate codes
  if (validated.taxCode === 'BR') {
    const taxablePayYTD = Math.floor(validated.grossPayYTD);
    const taxDueYTD = taxablePayYTD * 0.2;
    const taxThisPeriod = roundToTwoDecimals(taxDueYTD - validated.taxPaidYTD);
    checkForAnomalies(taxThisPeriod, validated.grossPayYTD / validated.period, 'BR cumulative', {
      taxCode: 'BR', isActualPeriodGross: false
    });
    return { taxThisPeriod, taxDueYTD: roundToTwoDecimals(taxDueYTD), freePayYTD: 0, freePayMonthly: 0, taxablePayYTD };
  }
  
  if (validated.taxCode === 'D0') {
    const taxablePayYTD = Math.floor(validated.grossPayYTD);
    const taxDueYTD = taxablePayYTD * 0.4;
    const taxThisPeriod = roundToTwoDecimals(taxDueYTD - validated.taxPaidYTD);
    checkForAnomalies(taxThisPeriod, validated.grossPayYTD / validated.period, 'D0 cumulative', {
      taxCode: 'D0', isActualPeriodGross: false
    });
    return { taxThisPeriod, taxDueYTD: roundToTwoDecimals(taxDueYTD), freePayYTD: 0, freePayMonthly: 0, taxablePayYTD };
  }
  
  if (validated.taxCode === 'D1') {
    const taxablePayYTD = Math.floor(validated.grossPayYTD);
    const taxDueYTD = taxablePayYTD * 0.45;
    const taxThisPeriod = roundToTwoDecimals(taxDueYTD - validated.taxPaidYTD);
    checkForAnomalies(taxThisPeriod, validated.grossPayYTD / validated.period, 'D1 cumulative', {
      taxCode: 'D1', isActualPeriodGross: false
    });
    return { taxThisPeriod, taxDueYTD: roundToTwoDecimals(taxDueYTD), freePayYTD: 0, freePayMonthly: 0, taxablePayYTD };
  }
  
  // Standard cumulative
  const freePayMonthly = taxCodeInfo.monthlyFreePay;
  const freePayYTD = roundToTwoDecimals(freePayMonthly * validated.period);
  const rawTaxableYTD = Math.floor(validated.grossPayYTD - freePayYTD);
  const taxablePayYTD = taxCodeInfo.allowance >= 0 ? Math.max(0, rawTaxableYTD) : rawTaxableYTD;
  
  let taxDueYTD = 0;
  if (taxablePayYTD > 0) {
    const basicRateAmount = Math.min(taxablePayYTD, 37700);
    taxDueYTD += basicRateAmount * 0.2;
  }
  if (taxablePayYTD > 37700) {
    const higherRateAmount = Math.min(taxablePayYTD - 37700, 125140 - 37700);
    taxDueYTD += higherRateAmount * 0.4;
  }
  if (taxablePayYTD > 125140) {
    const additionalRateAmount = taxablePayYTD - 125140;
    taxDueYTD += additionalRateAmount * 0.45;
  }
  
  const taxThisPeriod = roundToTwoDecimals(taxDueYTD - validated.taxPaidYTD);
  checkForAnomalies(taxThisPeriod, 0, 'Cumulative sync', {
    taxCode: validated.taxCode, isActualPeriodGross: false
  });
  
  return {
    taxThisPeriod,
    taxDueYTD: roundToTwoDecimals(taxDueYTD),
    freePayYTD,
    freePayMonthly,
    taxablePayYTD
  };
}

// ---------------------------------------------------------------------------
// Week 1/Month 1 (non-cumulative) tax calculation
// ---------------------------------------------------------------------------

export interface Week1Month1TaxResult {
  taxThisPeriod: number;
  freePayMonthly: number;
  taxablePayThisPeriod: number;
}

/**
 * Calculate tax on Week 1/Month 1 (non-cumulative) basis.
 * Each period is treated independently with 1/12th of annual bands.
 * 
 * Per HMRC spec Definition 10: monthly band limits rounded UP to nearest £1 (Cvalues).
 * Per HMRC spec para 4.5.2: tax capped at 50% of gross pay (regulatory limit).
 */
export async function calculateWeek1Month1Tax(
  grossPayThisPeriod: number,
  taxCode: string,
  taxYear?: string
): Promise<Week1Month1TaxResult> {
  const validated = validateWeek1Month1Inputs(grossPayThisPeriod, taxCode);
  
  const taxCodeInfo = parseTaxCode(validated.taxCode);
  const { taxRegion } = taxCodeInfo;
  
  // Handle NT code
  if (validated.taxCode === 'NT' || validated.taxCode === 'SNT' || validated.taxCode === 'CNT') {
    return { taxThisPeriod: 0, freePayMonthly: Infinity, taxablePayThisPeriod: 0 };
  }
  
  // Strip prefix
  let coreCode = validated.taxCode;
  if (taxRegion === 'scotland' && coreCode.startsWith('S')) coreCode = coreCode.substring(1);
  else if (taxRegion === 'wales' && coreCode.startsWith('C')) coreCode = coreCode.substring(1);
  
  // Handle flat-rate codes
  const flatRate = resolveFlatRateCode(coreCode, taxRegion);
  if (flatRate) {
    const taxablePayThisPeriod = Math.floor(validated.grossPayThisPeriod);
    let taxThisPeriod = roundToTwoDecimals(taxablePayThisPeriod * flatRate.rate);
    
    // Apply 50% regulatory limit
    const regulatoryLimit = Math.floor(validated.grossPayThisPeriod * 0.5 * 100) / 100;
    taxThisPeriod = Math.min(taxThisPeriod, regulatoryLimit);
    
    checkForAnomalies(taxThisPeriod, validated.grossPayThisPeriod, `${flatRate.label} W1/M1`, {
      taxCode: validated.taxCode, isActualPeriodGross: true
    });
    return { taxThisPeriod, freePayMonthly: 0, taxablePayThisPeriod };
  }
  
  // Standard W1/M1 calculation
  const freePayMonthly = taxCodeInfo.monthlyFreePay;
  const rawTaxable = Math.floor(validated.grossPayThisPeriod - freePayMonthly);
  const taxablePayThisPeriod = taxCodeInfo.allowance >= 0 ? Math.max(0, rawTaxable) : rawTaxable;
  
  let taxThisPeriod = 0;
  
  if (taxRegion === 'scotland') {
    taxThisPeriod = calculateScottishMonthlyTax(taxablePayThisPeriod);
  } else {
    // England/NI and Wales
    const taxBands = await getIncomeTaxBands(taxYear);
    
    // Monthly band limits: annual ÷ 12 rounded UP per HMRC spec Definition 10
    const annualBasicTo = taxBands.HIGHER_RATE.threshold_from / 100;
    const annualHigherTo = taxBands.ADDITIONAL_RATE.threshold_from / 100;
    const monthlyBasicLimit = Math.ceil(annualBasicTo / 12);
    const monthlyHigherLimit = Math.ceil(annualHigherTo / 12);
    
    if (taxablePayThisPeriod > 0) {
      const basicAmount = Math.min(taxablePayThisPeriod, monthlyBasicLimit);
      taxThisPeriod += basicAmount * taxBands.BASIC_RATE.rate;
    }
    if (taxablePayThisPeriod > monthlyBasicLimit) {
      const higherAmount = Math.min(taxablePayThisPeriod - monthlyBasicLimit, monthlyHigherLimit - monthlyBasicLimit);
      taxThisPeriod += higherAmount * taxBands.HIGHER_RATE.rate;
    }
    if (taxablePayThisPeriod > monthlyHigherLimit) {
      const additionalAmount = taxablePayThisPeriod - monthlyHigherLimit;
      taxThisPeriod += additionalAmount * taxBands.ADDITIONAL_RATE.rate;
    }
  }
  
  let finalTax = roundToTwoDecimals(taxThisPeriod);
  
  // Apply 50% regulatory limit (HMRC spec para 4.5.2)
  if (finalTax > 0) {
    const regulatoryLimit = Math.floor(validated.grossPayThisPeriod * 0.5 * 100) / 100;
    finalTax = Math.min(finalTax, regulatoryLimit);
  }
  
  checkForAnomalies(finalTax, validated.grossPayThisPeriod, 'W1/M1 calculation', {
    taxCode: validated.taxCode, isActualPeriodGross: true
  });
  
  return {
    taxThisPeriod: finalTax,
    freePayMonthly,
    taxablePayThisPeriod
  };
}
