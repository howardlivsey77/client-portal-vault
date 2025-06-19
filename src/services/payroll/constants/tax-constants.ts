
/**
 * UK Tax constants for 2025-2026
 */

// Basic tax rate bands for 2025-2026
export const TAX_BANDS = {
  PERSONAL_ALLOWANCE: { threshold_from: 0, threshold_to: 1257000, rate: 0.00 },
  BASIC_RATE: { threshold_from: 0, threshold_to: 3770000, rate: 0.20 },
  HIGHER_RATE: { threshold_from: 3770000, threshold_to: 12514000, rate: 0.40 },
  ADDITIONAL_RATE: { threshold_from: 12514000, threshold_to: null, rate: 0.45 }
};

// National Insurance contribution thresholds and rates for 2025-2026 (updated)
export const NI_THRESHOLDS = {
  LOWER_EARNINGS_LIMIT: { weekly: 125, monthly: 542, annual: 6500 }, // Updated for 2025/26
  PRIMARY_THRESHOLD: { weekly: 242, monthly: 1048, annual: 12570 },
  UPPER_EARNINGS_LIMIT: { weekly: 967, monthly: 4189, annual: 50270 },
  SECONDARY_THRESHOLD: { weekly: 175, monthly: 758, annual: 9100 }
};

export const NI_RATES = {
  MAIN_RATE: 0.12,
  HIGHER_RATE: 0.02
};

// Student Loan thresholds and rates for 2025-2026 (CORRECTED with official 2025/26 rates)
export const STUDENT_LOAN_THRESHOLDS = {
  PLAN_1: { weekly: 501.25, monthly: 2172.08, annual: 26065, rate: 0.09 }, // Pre-2012 students - CORRECTED
  PLAN_2: { weekly: 547.50, monthly: 2372.50, annual: 28470, rate: 0.09 }, // Post-2012 students - CORRECTED
  PLAN_4: { weekly: 629.71, monthly: 2728.75, annual: 32745, rate: 0.09 }, // Scottish students - CORRECTED
  PLAN_5: { weekly: 480.77, monthly: 2083.33, annual: 25000, rate: 0.09 }, // Post-2023 students (estimate)
  PLAN_6: { weekly: 403.85, monthly: 1750.00, annual: 21000, rate: 0.06 }  // Postgraduate loan - CORRECT
};
