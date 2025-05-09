
export interface PayrollHistoryItem {
  id: string;
  employee_id: string;
  payroll_period: string;
  tax_code: string;
  gross_pay_this_period: number;
  income_tax_this_period: number;
  nic_employee_this_period: number;
  student_loan_this_period: number;
  employee_pension_this_period: number;
  net_pay_this_period: number;
  created_at: string;
  employee_name?: string;
}
