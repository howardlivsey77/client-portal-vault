// Mock data for payslip report demonstration
// Toggle USE_SIMULATED_DATA in PayslipReport.tsx to switch between mock and real data

export const mockEmployees = [
  {
    id: "mock-emp-1",
    first_name: "Sarah",
    last_name: "Johnson",
    payroll_id: "EMP001",
    department: "Clinical",
    tax_code: "1257L",
    national_insurance_number: "AB123456C",
    nic_code: "A",
    address1: "14 Oak Avenue",
    address2: "Riverside",
    address3: "Manchester",
    address4: "",
    postcode: "M1 4WD",
  },
  {
    id: "mock-emp-2",
    first_name: "James",
    last_name: "Williams",
    payroll_id: "EMP002",
    department: "Administration",
    tax_code: "1257L",
    national_insurance_number: "CD789012E",
    nic_code: "A",
    address1: "28 Elm Street",
    address2: "Greenfield",
    address3: "Birmingham",
    address4: "",
    postcode: "B15 2TT",
  },
  {
    id: "mock-emp-3",
    first_name: "Emily",
    last_name: "Brown",
    payroll_id: "EMP003",
    department: "Finance",
    tax_code: "1257L",
    national_insurance_number: "EF345678G",
    nic_code: "A",
    address1: "7 Maple Road",
    address2: "Westbury",
    address3: "Leeds",
    address4: "",
    postcode: "LS1 5JK",
  },
  {
    id: "mock-emp-4",
    first_name: "Michael",
    last_name: "Taylor",
    payroll_id: "EMP004",
    department: "Clinical",
    tax_code: "BR",
    national_insurance_number: "GH901234I",
    nic_code: "A",
    address1: "52 Pine Close",
    address2: "",
    address3: "Liverpool",
    address4: "",
    postcode: "L3 8QW",
  },
];

export const mockPayrollPeriods = [
  {
    id: "mock-period-dec-2024",
    period_number: 9,
    period_name: "December 2024",
    date_from: "2024-12-01",
    date_to: "2024-12-31",
    financial_year: 2024,
  },
  {
    id: "mock-period-nov-2024",
    period_number: 8,
    period_name: "November 2024",
    date_from: "2024-11-01",
    date_to: "2024-11-30",
    financial_year: 2024,
  },
  {
    id: "mock-period-oct-2024",
    period_number: 7,
    period_name: "October 2024",
    date_from: "2024-10-01",
    date_to: "2024-10-31",
    financial_year: 2024,
  },
  {
    id: "mock-period-sep-2024",
    period_number: 6,
    period_name: "September 2024",
    date_from: "2024-09-01",
    date_to: "2024-09-30",
    financial_year: 2024,
  },
];

// Payroll results keyed by "employeeId_periodId"
export const mockPayrollResults: Record<string, {
  gross_pay_this_period: number;
  income_tax_this_period: number;
  nic_employee_this_period: number;
  nic_employer_this_period: number;
  employee_pension_this_period: number;
  nhs_pension_employee_this_period: number | null;
  nhs_pension_employer_this_period: number | null;
  student_loan_this_period: number;
  student_loan_plan: number | null;
  net_pay_this_period: number;
  tax_code: string;
  nic_letter: string;
  taxable_pay_this_period: number;
  taxable_pay_ytd: number;
  income_tax_ytd: number;
  nic_employee_ytd: number;
  nhs_pension_employee_ytd: number | null;
  nhs_pension_employer_ytd: number | null;
}> = {
  // Sarah Johnson - December 2024
  "mock-emp-1_mock-period-dec-2024": {
    gross_pay_this_period: 3500,
    income_tax_this_period: 582.40,
    nic_employee_this_period: 285.60,
    nic_employer_this_period: 398.24,
    employee_pension_this_period: 0,
    nhs_pension_employee_this_period: 315,
    nhs_pension_employer_this_period: 512.40,
    student_loan_this_period: 0,
    student_loan_plan: null,
    net_pay_this_period: 2317,
    tax_code: "1257L",
    nic_letter: "A",
    taxable_pay_this_period: 3500,
    taxable_pay_ytd: 31500,
    income_tax_ytd: 5241.60,
    nic_employee_ytd: 2570.40,
    nhs_pension_employee_ytd: 2835,
    nhs_pension_employer_ytd: 4611.60,
  },
  // Sarah Johnson - November 2024
  "mock-emp-1_mock-period-nov-2024": {
    gross_pay_this_period: 3500,
    income_tax_this_period: 582.40,
    nic_employee_this_period: 285.60,
    nic_employer_this_period: 398.24,
    employee_pension_this_period: 0,
    nhs_pension_employee_this_period: 315,
    nhs_pension_employer_this_period: 512.40,
    student_loan_this_period: 0,
    student_loan_plan: null,
    net_pay_this_period: 2317,
    tax_code: "1257L",
    nic_letter: "A",
    taxable_pay_this_period: 3500,
    taxable_pay_ytd: 28000,
    income_tax_ytd: 4659.20,
    nic_employee_ytd: 2284.80,
    nhs_pension_employee_ytd: 2520,
    nhs_pension_employer_ytd: 4099.20,
  },
  // James Williams - December 2024
  "mock-emp-2_mock-period-dec-2024": {
    gross_pay_this_period: 2800,
    income_tax_this_period: 442.40,
    nic_employee_this_period: 201.60,
    nic_employer_this_period: 282.56,
    employee_pension_this_period: 140,
    nhs_pension_employee_this_period: null,
    nhs_pension_employer_this_period: null,
    student_loan_this_period: 85,
    student_loan_plan: 2,
    net_pay_this_period: 1931,
    tax_code: "1257L",
    nic_letter: "A",
    taxable_pay_this_period: 2800,
    taxable_pay_ytd: 25200,
    income_tax_ytd: 3981.60,
    nic_employee_ytd: 1814.40,
    nhs_pension_employee_ytd: null,
    nhs_pension_employer_ytd: null,
  },
  // Emily Brown - December 2024
  "mock-emp-3_mock-period-dec-2024": {
    gross_pay_this_period: 4200,
    income_tax_this_period: 722.40,
    nic_employee_this_period: 369.60,
    nic_employer_this_period: 514.08,
    employee_pension_this_period: 210,
    nhs_pension_employee_this_period: null,
    nhs_pension_employer_this_period: null,
    student_loan_this_period: 0,
    student_loan_plan: null,
    net_pay_this_period: 2898,
    tax_code: "1257L",
    nic_letter: "A",
    taxable_pay_this_period: 4200,
    taxable_pay_ytd: 37800,
    income_tax_ytd: 6501.60,
    nic_employee_ytd: 3326.40,
    nhs_pension_employee_ytd: null,
    nhs_pension_employer_ytd: null,
  },
  // Michael Taylor - December 2024 (BR tax code - second job)
  "mock-emp-4_mock-period-dec-2024": {
    gross_pay_this_period: 1200,
    income_tax_this_period: 240,
    nic_employee_this_period: 57.60,
    nic_employer_this_period: 77.28,
    employee_pension_this_period: 0,
    nhs_pension_employee_this_period: 108,
    nhs_pension_employer_this_period: 175.68,
    student_loan_this_period: 0,
    student_loan_plan: null,
    net_pay_this_period: 794.40,
    tax_code: "BR",
    nic_letter: "A",
    taxable_pay_this_period: 1200,
    taxable_pay_ytd: 10800,
    income_tax_ytd: 2160,
    nic_employee_ytd: 518.40,
    nhs_pension_employee_ytd: 972,
    nhs_pension_employer_ytd: 1581.12,
  },
};

export const mockCompany = {
  id: "mock-company-1",
  name: "Acme Healthcare Ltd",
  trading_as: "Acme Medical Centre",
  tax_office_number: "123",
  tax_office_reference: "A456",
  address_line1: "100 Business Park",
  address_line2: "Enterprise Way",
  address_line3: "London",
  address_line4: "",
  post_code: "EC1A 1BB",
  logo_url: undefined as string | undefined,
};
