
import { useToast } from "@/hooks/use-toast";
import { generatePayslip } from "@/utils/payslipGenerator";
import { PayrollResult } from "@/services/payroll/types";
import { PayrollHistoryItem } from "./types";
import { getTaxYear, getTaxPeriod } from "@/utils/taxYearUtils";

export function usePayslipGenerator() {
  const { toast } = useToast();

  const handleDownloadPayslip = (item: PayrollHistoryItem) => {
    try {
      const payrollPeriod = new Date(item.payroll_period).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric'
      });
      
      // Get current tax year and period for the payroll date
      const payrollDate = new Date(item.payroll_period);
      const currentTaxYear = getTaxYear(payrollDate);
      const currentTaxPeriod = getTaxPeriod(payrollDate);
      
      // Convert db values from pence to pounds and create a complete PayrollResult object
      const payrollData: PayrollResult = {
        employeeId: item.employee_id,
        employeeName: item.employee_name || 'Employee',
        payrollId: item.id || '',
        taxCode: item.tax_code,
        taxRegion: 'UK',
        taxFreeAmount: item.free_pay_this_period / 100,
        nicCode: item.nic_letter || 'A',
        grossPay: item.gross_pay_this_period / 100,
        incomeTax: item.income_tax_this_period / 100,
        nationalInsurance: item.nic_employee_this_period / 100,
        studentLoan: item.student_loan_this_period / 100,
        pensionContribution: item.employee_pension_this_period / 100,
        pensionPercentage: 0, // Default value
        netPay: item.net_pay_this_period / 100,
        // Required fields for PayrollResult type that weren't in our original object
        monthlySalary: item.gross_pay_this_period / 100,
        additionalDeductions: [],
        additionalAllowances: [],
        additionalEarnings: [],
        totalDeductions: (
          item.income_tax_this_period + 
          item.nic_employee_this_period + 
          item.student_loan_this_period + 
          item.employee_pension_this_period
        ) / 100,
        totalAllowances: 0,
        // Add the new required fields for YTD support
        taxYear: item.tax_year || currentTaxYear,
        taxPeriod: item.tax_period || currentTaxPeriod,
        taxablePay: item.taxable_pay_this_period ? item.taxable_pay_this_period / 100 : item.gross_pay_this_period / 100,
        taxablePayYTD: item.taxable_pay_ytd ? item.taxable_pay_ytd / 100 : item.gross_pay_this_period / 100,
        incomeTaxYTD: item.income_tax_ytd ? item.income_tax_ytd / 100 : item.income_tax_this_period / 100,
        nationalInsuranceYTD: item.nic_employee_ytd ? item.nic_employee_ytd / 100 : item.nic_employee_this_period / 100,
        grossPayYTD: item.gross_pay_ytd ? item.gross_pay_ytd / 100 : item.gross_pay_this_period / 100,
        studentLoanPlan: item.student_loan_plan,
        studentLoanYTD: item.student_loan_this_period / 100 // Just this period for now
      };
      
      const filename = `${item.employee_name?.replace(/\s+/g, '-').toLowerCase() || 'employee'}-payslip-${item.payroll_period}.pdf`;
      generatePayslip(payrollData, payrollPeriod, filename);
      
      toast({
        title: "Payslip Generated",
        description: "Your payslip has been downloaded."
      });
    } catch (error) {
      console.error("Error generating payslip:", error);
      toast({
        title: "Error",
        description: "Failed to generate payslip",
        variant: "destructive"
      });
    }
  };

  return { handleDownloadPayslip };
}
