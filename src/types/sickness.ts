
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

export interface SicknessEntitlementSummary {
  full_pay_remaining: number;
  half_pay_remaining: number;
  full_pay_used: number;
  half_pay_used: number;
  current_tier: string;
  service_months: number;
}
