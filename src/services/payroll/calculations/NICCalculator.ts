
export interface NICThresholds {
  PT: number;   // Primary Threshold (employee starts paying)
  ST: number;   // Secondary Threshold (employer starts paying)
  UEL: number;  // Upper Earnings Limit
}

export interface NICRates {
  employee: Record<string, NICRateBand>;
  employer: Record<string, NICRateBand>;
}

export interface NICRateBand {
  LELToPT: number;       // Usually 0%
  PTToUEL: number;       // Standard band
  AboveUEL: number;      // Higher band
}

export interface NICResult {
  employeeNIC: number;  // In pence
  employerNIC: number;  // In pence
}

export class NICCalculator {
  private thresholds: NICThresholds;
  private rates: NICRates;

  constructor(thresholds: NICThresholds, rates: NICRates) {
    this.thresholds = thresholds;
    this.rates = rates;
  }

  /**
   * Calculate EE and ER NIC based on gross pay and NIC letter
   * @param grossPay - In pence (e.g., £2,800 = 280000)
   * @param nicLetter - e.g., 'A', 'B', 'C', 'H', 'J', 'M', etc.
   * @returns NICResult
   */
  calculate(grossPay: number, nicLetter: string): NICResult {
    const t = this.thresholds;
    const rEE = this.rates.employee[nicLetter];
    const rER = this.rates.employer[nicLetter];

    if (!rEE || !rER) {
      throw new Error(`Unsupported NIC letter: ${nicLetter}`);
    }

    const gross = grossPay;

    // --- Employee NIC (EE) ---
    let eeNIC = 0;

    if (gross <= t.PT) {
      eeNIC = 0;
    } else if (gross <= t.UEL) {
      eeNIC = rEE.PTToUEL * (gross - t.PT);
    } else {
      eeNIC =
        rEE.PTToUEL * (t.UEL - t.PT) +
        rEE.AboveUEL * (gross - t.UEL);
    }

    // --- Employer NIC (ER) ---
    let erNIC = 0;

    if (gross <= t.ST) {
      erNIC = 0;
    } else if (gross <= t.UEL) {
      erNIC = rER.PTToUEL * (gross - t.ST);
    } else {
      erNIC =
        rER.PTToUEL * (t.UEL - t.ST) +
        rER.AboveUEL * (gross - t.UEL);
    }

    return {
      employeeNIC: Math.round(eeNIC),
      employerNIC: Math.round(erNIC),
    };
  }
}
