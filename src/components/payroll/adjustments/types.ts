export interface OvertimeItem {
  id: string;
  hours: number;
  rateMultiplier: number;
  hourlyRate: number;
  amount: number;
}

export interface StatutoryPaymentItem {
  id: string;
  type: 'SMP' | 'SPP' | 'ShPP' | 'SAP' | 'SPBP';
  weeks: number;
  weeklyRate: number;
  amount: number;
}

export interface SicknessItem {
  id: string;
  daysQualifying: number;
  sspDailyRate: number;
  amount: number;
}

export interface ExtraPaymentItem {
  id: string;
  description: string;
  amount: number;
}

export interface ExtraDeductionItem {
  id: string;
  description: string;
  amount: number;
}

export interface PayrollAdjustments {
  overtime: OvertimeItem[];
  statutoryPayment: StatutoryPaymentItem[];
  sickness: SicknessItem[];
  extraPayments: ExtraPaymentItem[];
  extraDeductions: ExtraDeductionItem[];
}

export const emptyAdjustments: PayrollAdjustments = {
  overtime: [],
  statutoryPayment: [],
  sickness: [],
  extraPayments: [],
  extraDeductions: [],
};

export const statutoryPaymentTypes = [
  { value: 'SMP', label: 'Statutory Maternity Pay' },
  { value: 'SPP', label: 'Statutory Paternity Pay' },
  { value: 'ShPP', label: 'Shared Parental Pay' },
  { value: 'SAP', label: 'Statutory Adoption Pay' },
  { value: 'SPBP', label: 'Statutory Parental Bereavement Pay' },
] as const;

// SSP rate for 2024/25 is £116.75 per week
export const SSP_WEEKLY_RATE = 116.75;
export const SSP_DAILY_RATE = SSP_WEEKLY_RATE / 4; // Paid for qualifying days (max 4 per week)
