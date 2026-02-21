
/**
 * UK Tax constants for 2025-2026 and 2026-2027
 * 
 * VALID FOR: 2025/26 and 2026/27 tax years
 * 
 * Key changes from 2024/25:
 * - Employee NI main rate reduced from 12% to 8% (January 2024)
 * - Secondary Threshold reduced from £758 to £417 (Autumn Budget 2024)
 * - Employer NI rate increased to 15%
 */

// Basic tax rate bands for 2025-2026
export const TAX_BANDS = {
  PERSONAL_ALLOWANCE: { threshold_from: 0, threshold_to: 1257000, rate: 0.00 },
  BASIC_RATE: { threshold_from: 0, threshold_to: 3770000, rate: 0.20 },
  HIGHER_RATE: { threshold_from: 3770000, threshold_to: 12514000, rate: 0.40 },
  ADDITIONAL_RATE: { threshold_from: 12514000, threshold_to: null, rate: 0.45 }
};

// National Insurance contribution thresholds for 2025-2026 and 2026-2027
export const NI_THRESHOLDS = {
  LOWER_EARNINGS_LIMIT: { weekly: 125, monthly: 542, annual: 6500 },
  PRIMARY_THRESHOLD: { weekly: 242, monthly: 1048, annual: 12570 },
  UPPER_EARNINGS_LIMIT: { weekly: 967, monthly: 4189, annual: 50270 },
  // FIXED: ST reduced from £758 to £417 (Autumn Budget 2024)
  SECONDARY_THRESHOLD: { weekly: 96, monthly: 417, annual: 5000 }
};

// National Insurance rates for 2025-2026 and 2026-2027
export const NI_RATES = {
  // EMPLOYEE rates (2025/26 & 2026/27)
  EMPLOYEE_MAIN_RATE: 0.08,    // 8% - between PT and UEL (January 2024 cut)
  EMPLOYEE_HIGHER_RATE: 0.02,  // 2% - above UEL
  // EMPLOYER rates (2025/26 & 2026/27)  
  EMPLOYER_RATE: 0.15,         // 15% - above ST
  // Legacy aliases for backwards compatibility
  MAIN_RATE: 0.08,
  HIGHER_RATE: 0.02
};

// Student Loan thresholds and rates for 2025-2026
// Source: HMRC Student Loan guidance for software developers 2025-2026
// Plan types: 1 (pre-2012), 2 (post-2012 England/Wales), 4 (Scottish),
// PGL (Postgraduate Loan — can run alongside one plan type)
export const STUDENT_LOAN_THRESHOLDS = {
  PLAN_1: { weekly: 501.25, monthly: 2172.08, annual: 26065, rate: 0.09 },
  PLAN_2: { weekly: 547.50, monthly: 2372.50, annual: 28470, rate: 0.09 },
  PLAN_4: { weekly: 629.71, monthly: 2728.75, annual: 32745, rate: 0.09 },
  PGL:    { weekly: 403.85, monthly: 1750.00, annual: 21000, rate: 0.06 },
};

// ---------------------------------------------------------------------------
// NI Category Letters and Rate Groups
// Source: HMRC NI Guidance for Software Developers 2025-2026, Appendix 1
//
// Employee rate groups:
//   STANDARD    (A, M, H, F, V, N) — 8% PT-UEL, 2% above UEL
//   REDUCED     (B, I, E)          — 1.85% PT-UEL, 2% above UEL
//   OVER_SPA    (C, S, K)          — 0% employee (over State Pension Age)
//   DEFERMENT   (J, L, Z, D)       — 2% PT-UEL, 2% above UEL
//
// Employer rate groups (all categories):
//   Standard employer rate: 15% above ST
//   EXCEPTIONS (zero employer NI up to UST/AUST/VUST, then 15% above):
//     M (under 21)        — 0% ST to UST  (£50,270/yr = £4,189/month)
//     H (apprentice <25)  — 0% ST to AUST (£50,270/yr = £4,189/month)
//     V (veteran)         — 0% ST to VUST (£50,270/yr = £4,189/month)
//     Z (apprentice <25, deferment) — 0% ST to AUST
//
// Note: For 2025/26, UST = AUST = VUST = UEL = £50,270/year
// ---------------------------------------------------------------------------

export type NICategory = 'A' | 'B' | 'C' | 'M' | 'H' | 'Z' | 'J' | 'V';

export type NIEmployeeRateGroup = 'STANDARD' | 'REDUCED' | 'OVER_SPA' | 'DEFERMENT';
export type NIEmployerRateGroup = 'STANDARD' | 'ZERO_TO_SECONDARY_THRESHOLD';

export interface NICategoryRates {
  employeeRateGroup: NIEmployeeRateGroup;
  employerRateGroup: NIEmployerRateGroup;
  description: string;
}

export const NI_CATEGORY_RATES: Record<NICategory, NICategoryRates> = {
  A: { employeeRateGroup: 'STANDARD',   employerRateGroup: 'STANDARD',                    description: 'Standard employee' },
  B: { employeeRateGroup: 'REDUCED',    employerRateGroup: 'STANDARD',                    description: 'Reduced rate (married women/widows)' },
  C: { employeeRateGroup: 'OVER_SPA',   employerRateGroup: 'STANDARD',                    description: 'Over State Pension Age' },
  M: { employeeRateGroup: 'STANDARD',   employerRateGroup: 'ZERO_TO_SECONDARY_THRESHOLD', description: 'Under 21' },
  H: { employeeRateGroup: 'STANDARD',   employerRateGroup: 'ZERO_TO_SECONDARY_THRESHOLD', description: 'Apprentice under 25' },
  Z: { employeeRateGroup: 'DEFERMENT',  employerRateGroup: 'ZERO_TO_SECONDARY_THRESHOLD', description: 'Apprentice under 25, deferment' },
  J: { employeeRateGroup: 'DEFERMENT',  employerRateGroup: 'STANDARD',                    description: 'Deferment' },
  V: { employeeRateGroup: 'STANDARD',   employerRateGroup: 'ZERO_TO_SECONDARY_THRESHOLD', description: 'Veteran' },
};

export const NI_EMPLOYEE_RATES: Record<NIEmployeeRateGroup, { mainRate: number; additionalRate: number }> = {
  STANDARD:  { mainRate: 0.08,   additionalRate: 0.02 },
  REDUCED:   { mainRate: 0.0185, additionalRate: 0.02 },
  OVER_SPA:  { mainRate: 0,      additionalRate: 0    },
  DEFERMENT: { mainRate: 0.02,   additionalRate: 0.02 },
};

// Employer always pays 15% above ST — except M, H, V, Z who pay 0% up to UST/AUST/VUST
// For 2025/26: UST = AUST = VUST = UEL = £50,270 annual / £4,189 monthly
export const NI_EMPLOYER_RATES = {
  STANDARD_RATE: 0.15,
} as const;

// Monthly thresholds for employer zero-rate upper limits (UST/AUST/VUST)
// For 2025/26 these all equal the UEL
export const NI_UPPER_SECONDARY_THRESHOLD = {
  monthly: 4189, // UST = AUST = VUST = UEL for 2025/26
  annual: 50270,
} as const;
