/**
 * UK Tax constants for 2023-2024
 */

// Basic tax rate bands for 2023-2024
export const TAX_BANDS = {
  PERSONAL_ALLOWANCE: { threshold_from: 0, threshold_to: 1257000, rate: 0.00 },
  BASIC_RATE: { threshold_from: 0, threshold_to: 3770000, rate: 0.20 },
  HIGHER_RATE: { threshold_from: 3770000, threshold_to: 12514000, rate: 0.40 },
  ADDITIONAL_RATE: { threshold_from: 12514000, threshold_to: null, rate: 0.45 }
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
