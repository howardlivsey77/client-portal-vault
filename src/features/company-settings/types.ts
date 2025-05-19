
import { EligibilityRule } from "@/components/employees/details/work-pattern/types";

export interface SicknessScheme {
  id: string;
  name: string;
  eligibilityRules?: EligibilityRule[] | null;
}

export interface CompanyFormValues {
  name: string;
  tradingAs?: string;
  payeRef?: string;
  accountsOfficeNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  postCode?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}
