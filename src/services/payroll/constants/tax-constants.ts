
/**
 * This file is kept for backward compatibility.
 * Consider migrating to use database-driven constants from tax-constants-service.ts
 */

// Basic tax rate bands for 2023-2024
export const TAX_BANDS = {
  PERSONAL_ALLOWANCE: { threshold: 12570, rate: 0 },
  BASIC_RATE: { threshold: 50270, rate: 0.20 },
  HIGHER_RATE: { threshold: 125140, rate: 0.40 },
  ADDITIONAL_RATE: { threshold: Infinity, rate: 0.45 }
};

// National Insurance contribution thresholds and rates for 2023-2024
export const NI_THRESHOLDS = {
  PRIMARY_THRESHOLD: { weekly: 242, monthly: 1048, annual: 12570 },
  UPPER_EARNINGS_LIMIT: { weekly: 967, monthly: 4189, annual: 50270 }
};

export const NI_RATES = {
  MAIN_RATE: 0.12,
  HIGHER_RATE: 0.02
};
