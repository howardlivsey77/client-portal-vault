
export type Company = {
  id: string;
  name: string;
  trading_as?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  address_line3?: string | null;
  address_line4?: string | null;
  post_code?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  tax_office_number?: string | null;
  tax_office_reference?: string | null;
  accounts_office_number?: string | null;
  hmrc_gateway_user_id?: string | null;
  hmrc_gateway_password?: string | null;
  logo_url?: string | null;
  payroll_start_year?: number | null;
  payroll_start_period?: number | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
};

export type CompanyWithRole = {
  id: string;
  name: string;
  role: string;
};

