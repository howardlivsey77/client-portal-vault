
import { useToast } from "@/hooks/use-toast";
import { generatePayslip } from "@/utils/payslipGenerator";
import { PayrollResult } from "@/services/payroll/types";
import { PayrollHistoryItem } from "./types";

export function usePayslipGenerator() {
  const { toast } = useToast();

  const handleDownloadPayslip = (item: PayrollHistoryItem) => {
    try {
      const payrollPeriod = new Date(item.payroll_period).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric'
      });
      
      // Convert db values from pence to pounds and create a complete PayrollResult object
      const payrollData: PayrollResult = {
        employeeId: item.employee_id,
        employeeName: item.employee_name || 'Employee',
        taxCode: item.tax_code,
        grossPay: item.gross_pay_this_period / 100,
        incomeTax: item.income_tax_this_period / 100,
        nationalInsurance: item.nic_employee_this_period / 100,
        studentLoan: item.student_loan_this_period / 100,
        pensionContribution: item.employee_pension_this_period / 100,
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
        totalAllowances: 0
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
