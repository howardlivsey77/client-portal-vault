export interface PayslipData {
  // Employee info
  employeeId: string;
  employeeName: string;
  payrollId?: string;
  address?: {
    line1?: string;
    line2?: string;
    line3?: string;
    line4?: string;
    postcode?: string;
  };
  department?: string;
  taxCode: string;
  niNumber?: string;
  niTable?: string;
  
  // Period info
  periodNumber: number;
  periodName: string;
  paymentDate: string;
  
  // Payments
  payments: Array<{
    description: string;
    amount: number;
  }>;
  grossPay: number;
  sicknessNote?: string; // Note about sickness days included in salary
  
  // Deductions
  deductions: Array<{
    description: string;
    amount: number;
  }>;
  totalDeductions: number;
  
  // Net pay
  netPay: number;
  
  // This period figures
  thisPeriod: {
    taxableGrossPay: number;
    employerNI: number;
  };
  
  // Year to date figures
  yearToDate: {
    taxableGrossPay: number;
    tax: number;
    employeeNI: number;
    employerNI: number;
    employeePension: number;
    employerPension: number;
  };
}

export interface CompanyDetails {
  name: string;
  tradingAs?: string;
  payeRef?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  postCode?: string;
  logoUrl?: string;
}

export interface PayslipGeneratorOptions {
  payslipData: PayslipData;
  company: CompanyDetails;
}
