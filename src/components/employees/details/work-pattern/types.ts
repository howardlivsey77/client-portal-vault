
import { Employee } from "@/types";

export interface WorkDay {
  day: string;
  isWorking: boolean;
  startTime: string | null;
  endTime: string | null;
  payrollId: string | null;
}

export interface WorkPatternCardProps {
  employee: Employee;
  isAdmin: boolean;
  refetchEmployeeData: () => Promise<void>;
  updateEmployeeField?: (fieldName: string, value: any) => Promise<boolean>;
}

export interface SicknessScheme {
  id: string;
  name: string;
  eligibilityRules?: EligibilityRule[] | null;
}

export interface EligibilityRule {
  id: string;
  serviceFrom: number;
  serviceTo: number | null;
  serviceFromUnit: 'days' | 'weeks' | 'months' | 'years';
  serviceToUnit: 'days' | 'weeks' | 'months' | 'years';
  fullPayAmount: number;
  halfPayAmount: number;
  fullPayUnit: 'days' | 'weeks' | 'months';
  halfPayUnit: 'days' | 'weeks' | 'months';
  sicknessPay: string;
  hasWaitingDays?: boolean; // If true, 3 working day wait before company entitlement kicks in
  // Legacy fields for backward compatibility
  serviceMonthsFrom?: number;
  serviceMonthsTo?: number | null;
  fullPayDays?: number;
  halfPayDays?: number;
}
