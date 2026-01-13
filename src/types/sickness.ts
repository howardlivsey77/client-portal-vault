
export interface SicknessRecord {
  id: string;
  employee_id: string;
  company_id: string;
  start_date: string;
  end_date?: string;
  total_days: number;
  is_certified: boolean;
  certification_required_from_day: number;
  reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Payroll period targeting - optional, for SSP calculation in specific periods
  payroll_period_number?: number | null;
  payroll_financial_year?: number | null;
}

export interface EntitlementUsage {
  id: string;
  employee_id: string;
  company_id: string;
  sickness_scheme_id?: string;
  entitlement_period_start: string;
  entitlement_period_end: string;
  full_pay_used_days: number;
  half_pay_used_days: number;
  full_pay_entitled_days: number;
  half_pay_entitled_days: number;
  current_service_months: number;
  current_rule_id?: string;
  created_at: string;
  updated_at: string;
}

export interface HistoricalBalance {
  id: string;
  employee_id: string;
  company_id: string;
  balance_date: string;
  full_pay_days_used: number;
  half_pay_days_used: number;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface SicknessEntitlementSummary {
  full_pay_remaining: number;
  half_pay_remaining: number;
  full_pay_used_rolling_12_months: number;
  half_pay_used_rolling_12_months: number;
  total_used_rolling_12_months: number;
  current_tier: string;
  service_months: number;
  rolling_period_start: string;
  rolling_period_end: string;
  // SSP fields (optional for backward compatibility)
  ssp_entitled_days?: number;
  ssp_used_rolling_12_months?: number;
  ssp_remaining_days?: number;
  // Company sickness waiting days (3 working day wait before entitlement kicks in)
  hasWaitingDays?: boolean;
}

