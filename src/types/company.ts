
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
  paye_ref?: string | null;
  accounts_office_number?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
};

export type CompanyWithRole = {
  id: string;
  name: string;
  role: string;
};
