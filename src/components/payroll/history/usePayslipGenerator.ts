
import { useState } from 'react';
import { generatePayslipPDF } from '@/utils/payslipGenerator';
import { formatCurrency } from '@/lib/formatters';
import { PayrollResult } from '@/services/payroll/types';

export function usePayslipGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Generate a payslip PDF for a given payroll record
  const generatePayslip = async (record: any) => {
    try {
      setIsGenerating(true);
      
      // Convert the database record format to the format expected by the PDF generator
      const payrollResult: PayrollResult = {
        employeeId: record.employee_id,
        employeeName: record.employee_name || 'Employee',
        payrollId: record.payroll_id || '',
        taxCode: record.tax_code,
        taxRegion: record.tax_region || 'UK',
        taxFreeAmount: (record.free_pay_this_period || 0) / 100,
        nicCode: record.nic_letter || 'A',
        grossPay: (record.gross_pay_this_period || 0) / 100,
        incomeTax: (record.income_tax_this_period || 0) / 100,
        nationalInsurance: (record.nic_employee_this_period || 0) / 100,
        studentLoan: (record.student_loan_this_period || 0) / 100,
        studentLoanPlan: record.student_loan_plan ? record.student_loan_plan.toString() : undefined,
        pensionContribution: (record.employee_pension_this_period || 0) / 100,
        pensionPercentage: record.pension_percentage || 0,
        monthlySalary: (record.gross_pay_this_period || 0) / 100,
        taxYear: record.tax_year,
        taxPeriod: record.tax_period,
        taxablePay: (record.taxable_pay_this_period || 0) / 100,
        totalDeductions: (
          (record.income_tax_this_period || 0) + 
          (record.nic_employee_this_period || 0) + 
          (record.student_loan_this_period || 0) + 
          (record.employee_pension_this_period || 0)
        ) / 100,
        netPay: (record.net_pay_this_period || 0) / 100,
        additionalEarnings: [],
        additionalDeductions: [],
        additionalAllowances: [],
        totalAllowances: 0,
        grossPayYTD: (record.gross_pay_ytd || 0) / 100,
        taxablePayYTD: (record.taxable_pay_ytd || 0) / 100,
        incomeTaxYTD: (record.income_tax_ytd || 0) / 100,
        nationalInsuranceYTD: (record.nic_employee_ytd || 0) / 100,
        studentLoanYTD: (record.student_loan_ytd || 0) / 100
      };
      
      // Generate the PDF
      const dateStr = new Date(record.payroll_period).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      await generatePayslipPDF(payrollResult, dateStr);
    } catch (error) {
      console.error('Error generating payslip:', error);
      // Handle error
    } finally {
      setIsGenerating(false);
    }
  };
  
  return { generatePayslip, isGenerating };
}
