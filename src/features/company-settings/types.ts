import { EligibilityRule } from "@/components/employees/details/work-pattern/types";

export interface SicknessScheme {
  id: string;
  name: string;
  eligibilityRules?: EligibilityRule[] | null;
}

export interface CompanyFormValues {
  name: string;
  tradingAs?: string;
  taxOfficeNumber?: string;
  taxOfficeReference?: string;
  accountsOfficeNumber?: string;
  hmrcGatewayUserId?: string;
  hmrcGatewayPassword?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  postCode?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  payrollStartYear?: number;
  payrollStartPeriod?: number;
}

// Re-export teamnet rate config types
export { type RateCondition, type TeamnetRateConfig } from './types/teamnetRateConfig';
