export interface CompanyHoliday {
  id?: string;
  company_id?: string;
  name: string;
  date: string; // ISO date string YYYY-MM-DD
  rate_override: number;
  all_day: boolean;
  time_from?: string | null;
  time_to?: string | null;
  is_recurring: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyHolidaySettings {
  id?: string;
  company_id?: string;
  use_uk_bank_holidays: boolean;
  bank_holiday_rate: number;
  created_at?: string;
  updated_at?: string;
}

export interface UkBankHoliday {
  date: string;
  name: string;
}
