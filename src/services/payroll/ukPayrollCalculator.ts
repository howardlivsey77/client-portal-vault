
import { roundToTwoDecimals } from "@/lib/formatters";

// Tax code handling
export interface TaxCode {
  code: string;
  allowance: number;
}

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

/**
 * Parse a UK tax code to determine the tax-free allowance
 */
export function parseTaxCode(taxCode: string): TaxCode {
  // Handle common tax code formats
  taxCode = taxCode.toUpperCase().trim();
  
  // Basic number-L code (e.g., 1257L)
  if (/^\d+L$/.test(taxCode)) {
    const numberPart = parseInt(taxCode.replace('L', ''), 10);
    return { code: taxCode, allowance: numberPart * 10 };
  }
  
  // BR code (basic rate on all income)
  if (taxCode === 'BR') {
    return { code: taxCode, allowance: 0 };
  }
  
  // NT code (no tax)
  if (taxCode === 'NT') {
    return { code: taxCode, allowance: Infinity };
  }
  
  // K codes (reduce personal allowance)
  if (/^K\d+$/.test(taxCode)) {
    const numberPart = parseInt(taxCode.replace('K', ''), 10);
    return { code: taxCode, allowance: -numberPart * 10 };
  }
  
  // Default to standard personal allowance if code not recognized
  return { code: taxCode, allowance: TAX_BANDS.PERSONAL_ALLOWANCE.threshold };
}

/**
 * Calculate income tax based on annual salary and tax code
 */
export function calculateIncomeTax(annualSalary: number, taxCode: string): number {
  const { allowance } = parseTaxCode(taxCode);
  let taxableIncome = Math.max(0, annualSalary - allowance);
  let tax = 0;
  
  // Calculate tax for each band
  if (taxableIncome > TAX_BANDS.HIGHER_RATE.threshold) {
    tax += (taxableIncome - TAX_BANDS.HIGHER_RATE.threshold) * TAX_BANDS.ADDITIONAL_RATE.rate;
    taxableIncome = TAX_BANDS.HIGHER_RATE.threshold;
  }
  
  if (taxableIncome > TAX_BANDS.BASIC_RATE.threshold) {
    tax += (taxableIncome - TAX_BANDS.BASIC_RATE.threshold) * TAX_BANDS.HIGHER_RATE.rate;
    taxableIncome = TAX_BANDS.BASIC_RATE.threshold;
  }
  
  if (taxableIncome > TAX_BANDS.PERSONAL_ALLOWANCE.threshold) {
    tax += (taxableIncome - TAX_BANDS.PERSONAL_ALLOWANCE.threshold) * TAX_BANDS.BASIC_RATE.rate;
  }
  
  return roundToTwoDecimals(tax);
}

/**
 * Calculate monthly income tax
 */
export function calculateMonthlyIncomeTax(monthlySalary: number, taxCode: string): number {
  const annualSalary = monthlySalary * 12;
  const annualTax = calculateIncomeTax(annualSalary, taxCode);
  return roundToTwoDecimals(annualTax / 12);
}

/**
 * Calculate National Insurance contributions
 */
export function calculateNationalInsurance(monthlySalary: number): number {
  const primaryThreshold = NI_THRESHOLDS.PRIMARY_THRESHOLD.monthly;
  const upperLimit = NI_THRESHOLDS.UPPER_EARNINGS_LIMIT.monthly;
  
  let ni = 0;
  
  // Main rate between primary threshold and upper earnings limit
  if (monthlySalary > primaryThreshold) {
    const mainRatePortion = Math.min(monthlySalary, upperLimit) - primaryThreshold;
    ni += mainRatePortion * NI_RATES.MAIN_RATE;
    
    // Higher rate above upper earnings limit
    if (monthlySalary > upperLimit) {
      ni += (monthlySalary - upperLimit) * NI_RATES.HIGHER_RATE;
    }
  }
  
  return roundToTwoDecimals(ni);
}

/**
 * Calculate student loan repayments
 */
export function calculateStudentLoan(monthlySalary: number, planType: 1 | 2 | 4 | 5 | null): number {
  if (!planType) return 0;
  
  const annualSalary = monthlySalary * 12;
  let threshold, rate;
  
  switch (planType) {
    case 1:
      threshold = 22015; // Plan 1 threshold
      rate = 0.09;
      break;
    case 2:
      threshold = 27295; // Plan 2 threshold
      rate = 0.09;
      break;
    case 4:
      threshold = 27660; // Plan 4 threshold
      rate = 0.09;
      break;
    case 5:
      threshold = 25000; // Plan 5 threshold
      rate = 0.09;
      break;
    default:
      return 0;
  }
  
  if (annualSalary <= threshold) return 0;
  
  const monthlyRepayment = ((annualSalary - threshold) / 12) * rate;
  return roundToTwoDecimals(monthlyRepayment);
}

/**
 * Calculate pension contribution
 */
export function calculatePension(monthlySalary: number, pensionPercentage: number): number {
  if (pensionPercentage <= 0) return 0;
  return roundToTwoDecimals(monthlySalary * (pensionPercentage / 100));
}

/**
 * Main function to calculate monthly payroll
 */
export interface PayrollDetails {
  employeeId: string;
  employeeName: string;
  payrollId?: string;
  monthlySalary: number;
  taxCode: string;
  pensionPercentage?: number;
  studentLoanPlan?: 1 | 2 | 4 | 5 | null;
  additionalDeductions?: Array<{ description: string, amount: number }>;
  additionalAllowances?: Array<{ description: string, amount: number }>;
}

export interface PayrollResult {
  employeeId: string;
  employeeName: string;
  payrollId?: string;
  grossPay: number;
  incomeTax: number;
  nationalInsurance: number;
  studentLoan: number;
  pensionContribution: number;
  additionalDeductions: Array<{ description: string, amount: number }>;
  additionalAllowances: Array<{ description: string, amount: number }>;
  totalDeductions: number;
  totalAllowances: number;
  netPay: number;
}

export function calculateMonthlyPayroll(details: PayrollDetails): PayrollResult {
  const {
    employeeId,
    employeeName,
    payrollId,
    monthlySalary,
    taxCode,
    pensionPercentage = 0,
    studentLoanPlan = null,
    additionalDeductions = [],
    additionalAllowances = []
  } = details;
  
  // Calculate deductions
  const incomeTax = calculateMonthlyIncomeTax(monthlySalary, taxCode);
  const nationalInsurance = calculateNationalInsurance(monthlySalary);
  const studentLoan = calculateStudentLoan(monthlySalary, studentLoanPlan);
  const pensionContribution = calculatePension(monthlySalary, pensionPercentage);
  
  // Calculate totals
  const totalAdditionalDeductions = additionalDeductions.reduce((sum, item) => sum + item.amount, 0);
  const totalAdditionalAllowances = additionalAllowances.reduce((sum, item) => sum + item.amount, 0);
  
  const totalDeductions = incomeTax + nationalInsurance + studentLoan + pensionContribution + totalAdditionalDeductions;
  const totalAllowances = totalAdditionalAllowances;
  const netPay = monthlySalary - totalDeductions + totalAllowances;
  
  return {
    employeeId,
    employeeName,
    payrollId,
    grossPay: roundToTwoDecimals(monthlySalary),
    incomeTax: roundToTwoDecimals(incomeTax),
    nationalInsurance: roundToTwoDecimals(nationalInsurance),
    studentLoan: roundToTwoDecimals(studentLoan),
    pensionContribution: roundToTwoDecimals(pensionContribution),
    additionalDeductions,
    additionalAllowances,
    totalDeductions: roundToTwoDecimals(totalDeductions),
    totalAllowances: roundToTwoDecimals(totalAllowances),
    netPay: roundToTwoDecimals(netPay)
  };
}
