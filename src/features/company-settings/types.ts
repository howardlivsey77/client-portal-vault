
export type CompanyFormValues = {
  companyName: string;
  tradingAs: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  addressLine4: string;
  postCode: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  payeRef: string;
  accountsOfficeNumber: string;
}

export type EligibilityRule = {
  id: string;
  serviceMonthsFrom: number;
  serviceMonthsTo: number;
  companyPaidDays: number;
  sicknessPay: 'SSP' | 'NoSSP' | 'FullPay' | 'HalfPay';
}

export type SicknessScheme = {
  id: string;
  name: string;
  eligibilityRules: EligibilityRule[];
}
