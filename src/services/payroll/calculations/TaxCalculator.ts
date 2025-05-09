
export interface TaxCalculationParams {
  taxablePay: number;         // Current period taxable pay (in pence)
  period: number;             // Current month (1-12)
  taxCode: string;            // e.g., "1257L", "1257L M1", "S1257L", "K500"
  totalPreviousPay?: number;  // Optional YTD pay before this period (in pence)
  totalPreviousTax?: number;  // Optional YTD tax paid before this period (in pence)
}

export interface TaxCalculationResult {
  taxCode: string;
  emergencyCode: boolean;
  taxThisPeriod: number;      // In pence
  totalTaxToDate: number;     // In pence
}

export interface TaxBands {
  // Standard UK bands
  basicRateThreshold: number;
  higherRateThreshold: number;
  basicRate: number;
  higherRate: number;
  additionalRate: number;

  // Scottish bands (optional)
  scottishStarterRateThreshold?: number;
  scottishBasicRateThreshold?: number;
  scottishIntermediateRateThreshold?: number;
  scottishHigherRateThreshold?: number;
  scottishTopRateThreshold?: number;
  scottishStarterRate?: number;
  scottishBasicRate?: number;
  scottishIntermediateRate?: number;
  scottishHigherRate?: number;
  scottishTopRate?: number;
}

export class TaxCalculator {
  private bands: TaxBands;
  private periodsInYear: number = 12;

  constructor(constants: { hmrcTax: TaxBands }) {
    if (!constants?.hmrcTax) {
      throw new Error('Tax constants are required');
    }
    this.bands = constants.hmrcTax;
  }

  calculate(params: TaxCalculationParams): TaxCalculationResult {
    const {
      taxablePay,
      period,
      taxCode,
      totalPreviousPay = 0,
      totalPreviousTax = 0,
    } = params;

    const isEmergency = taxCode.endsWith('M1');
    const cleanTaxCode = taxCode.replace(/ M1$/, '');
    const isScottish = cleanTaxCode.startsWith('S');
    const baseCode = isScottish ? cleanTaxCode.substring(1) : cleanTaxCode;

    const isKCode = baseCode.startsWith('K');
    const isBR = baseCode === 'BR';
    const isD0 = baseCode === 'D0';
    const isD1 = baseCode === 'D1';
    const isNT = baseCode === 'NT';

    const cumulativePay = taxablePay + (isEmergency ? 0 : totalPreviousPay);
    const allowance = this.getAllowance(baseCode, isEmergency ? 1 : period, isKCode);
    const adjustedTaxable = Math.max(0, (cumulativePay - allowance) / 100); // in £

    let taxDueToDate = 0;

    if (isNT) {
      taxDueToDate = 0;
    } else if (isBR) {
      taxDueToDate = adjustedTaxable * this.bands.basicRate;
    } else if (isD0) {
      taxDueToDate = adjustedTaxable * this.bands.higherRate;
    } else if (isD1) {
      taxDueToDate = adjustedTaxable * this.bands.additionalRate;
    } else {
      taxDueToDate = isScottish
        ? this.applyScottishBands(adjustedTaxable)
        : this.applyStandardBands(adjustedTaxable);
    }

    const taxThisPeriod = Math.max(0, Math.round(taxDueToDate * 100 - (isEmergency ? 0 : totalPreviousTax)));

    return {
      taxCode,
      emergencyCode: isEmergency,
      taxThisPeriod,
      totalTaxToDate: Math.round(taxDueToDate * 100),
    };
  }

  private getAllowance(taxCode: string, month: number, isKCode: boolean): number {
    if (isKCode) {
      const val = parseInt(taxCode.substring(1), 10) * 10;
      return -Math.round((val / this.periodsInYear) * month * 100);
    }

    const match = taxCode.match(/^(\d{3,4})L$/);
    if (!match) return 0;

    // For tax codes like 1257L, extract 1257 and multiply by 10 to get annual allowance
    const allowance = parseInt(match[1], 10) * 10;
    
    // Calculate monthly allowance based on current period
    // For emergency tax, month will be 1, so it returns one month's worth of allowance
    // For cumulative tax, it returns allowance for all months up to current month
    return Math.round((allowance / this.periodsInYear) * month * 100); // in pence
  }

  private applyStandardBands(pay: number): number {
    const {
      basicRateThreshold,
      higherRateThreshold,
      basicRate,
      higherRate,
      additionalRate,
    } = this.bands;

    const basicLimit = basicRateThreshold / 100;
    const higherLimit = higherRateThreshold / 100;

    if (pay <= basicLimit) {
      return pay * basicRate;
    } else if (pay <= higherLimit) {
      return (
        basicLimit * basicRate +
        (pay - basicLimit) * higherRate
      );
    } else {
      return (
        basicLimit * basicRate +
        (higherLimit - basicLimit) * higherRate +
        (pay - higherLimit) * additionalRate
      );
    }
  }

  private applyScottishBands(pay: number): number {
    const b = this.bands;

    if (
      b.scottishStarterRateThreshold === undefined ||
      b.scottishBasicRateThreshold === undefined ||
      b.scottishIntermediateRateThreshold === undefined ||
      b.scottishHigherRateThreshold === undefined ||
      b.scottishTopRateThreshold === undefined ||
      b.scottishStarterRate === undefined ||
      b.scottishBasicRate === undefined ||
      b.scottishIntermediateRate === undefined ||
      b.scottishHigherRate === undefined ||
      b.scottishTopRate === undefined
    ) {
      throw new Error('Scottish tax band thresholds and rates are not fully defined.');
    }

    const thresholds = {
      starter: b.scottishStarterRateThreshold / 100,
      basic: b.scottishBasicRateThreshold / 100,
      intermediate: b.scottishIntermediateRateThreshold / 100,
      higher: b.scottishHigherRateThreshold / 100,
      top: b.scottishTopRateThreshold / 100,
    };

    let tax = 0;

    if (pay <= thresholds.starter) {
      return pay * b.scottishStarterRate;
    }

    if (pay > thresholds.starter) {
      tax += (Math.min(pay, thresholds.basic) - thresholds.starter) * b.scottishBasicRate;
    }

    if (pay > thresholds.basic) {
      tax += (Math.min(pay, thresholds.intermediate) - thresholds.basic) * b.scottishIntermediateRate;
    }

    if (pay > thresholds.intermediate) {
      tax += (Math.min(pay, thresholds.higher) - thresholds.intermediate) * b.scottishHigherRate;
    }

    if (pay > thresholds.top) {
      tax += (pay - thresholds.top) * b.scottishTopRate;
    }

    return tax;
  }
}
