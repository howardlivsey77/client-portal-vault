export type EmployeeHoursData = {
  employeeId: string;
  employeeName: string;
  extraHours: number;
  entries: number;
  rateType?: string;
  rateValue?: number;
  payrollId?: string;
};

export type ExtraHoursSummary = {
  totalEntries: number;
  totalExtraHours: number;
  dateRange: {
    from: string;
    to: string;
  };
  employeeCount: number;
  employeeDetails: EmployeeHoursData[];
  totalRate1Hours?: number;
  totalRate2Hours?: number;
  totalRate3Hours?: number;
  totalRate4Hours?: number;
};

export type PayrollFile = File | null;

export type PayrollFiles = {
  extraHours: PayrollFile;
  absences: PayrollFile;
};

export type WizardStep = {
  title: string;
  component: React.ReactNode;
};

export type { EmployeeMatchingResults, EmployeeMatchResult, EmployeeMatchCandidate } from '@/services/payroll/employeeMatching';
