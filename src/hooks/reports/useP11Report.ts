import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/providers";

export interface P11PeriodData {
  taxPeriod: number;
  periodStartDate: string | null;
  periodEndDate: string | null;
  nicLetter: string;
  earningsAtLEL: number;
  earningsLELtoPT: number;
  earningsPTtoUEL: number;
  earningsAboveUEL: number;
  employeeNIC: number;
  employerNIC: number;
  taxCode: string;
  grossPay: number;
  taxablePay: number;
  incomeTax: number;
  employeePension: number;
  studentLoan: number;
  nhsPensionEmployee: number;
}

export interface P11YTDTotals {
  grossPayYTD: number;
  taxablePayYTD: number;
  incomeTaxYTD: number;
  employeeNICYTD: number;
  employerNICYTD: number;
  employeePensionYTD: number;
  employerPensionYTD: number;
  studentLoanYTD: number;
  nhsPensionEmployeeYTD: number;
  nhsPensionEmployerYTD: number;
  freePayYTD: number;
  netPayYTD: number;
}

export interface P11EmployeeDetails {
  id: string;
  firstName: string;
  lastName: string;
  niNumber: string | null;
  dateOfBirth: string | null;
  hireDate: string;
  leaveDate: string | null;
  department: string;
  payrollId: string | null;
}

export interface P11CompanyDetails {
  name: string;
  payeRef: string | null;
  accountsOfficeNumber: string | null;
}

export interface P11ReportData {
  employee: P11EmployeeDetails;
  company: P11CompanyDetails;
  taxYear: string;
  periods: P11PeriodData[];
  ytdTotals: P11YTDTotals;
}

interface UseP11ReportResult {
  reportData: P11ReportData | null;
  loading: boolean;
  error: string | null;
  fetchReport: (employeeId: string, taxYear: string) => Promise<void>;
}

export function useP11Report(): UseP11ReportResult {
  const [reportData, setReportData] = useState<P11ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentCompany } = useCompany();

  const fetchReport = async (employeeId: string, taxYear: string) => {
    if (!currentCompany?.id || !employeeId || !taxYear) {
      setError("Missing required parameters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch employee details
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("id, first_name, last_name, national_insurance_number, date_of_birth, hire_date, leave_date, department, payroll_id")
        .eq("id", employeeId)
        .single();

      if (employeeError) throw employeeError;

      // Fetch company details
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("name, paye_ref, accounts_office_number")
        .eq("id", currentCompany.id)
        .single();

      if (companyError) throw companyError;

      // Fetch payroll results for the tax year
      const { data: payrollData, error: payrollError } = await supabase
        .from("payroll_results")
        .select("*")
        .eq("employee_id", employeeId)
        .eq("tax_year", taxYear)
        .eq("company_id", currentCompany.id)
        .order("tax_period", { ascending: true });

      if (payrollError) throw payrollError;

      // Map payroll data to P11 period format
      const periods: P11PeriodData[] = (payrollData || []).map((row) => ({
        taxPeriod: row.tax_period || 0,
        periodStartDate: row.period_start_date,
        periodEndDate: row.period_end_date,
        nicLetter: row.nic_letter || "A",
        earningsAtLEL: row.earnings_at_lel_this_period || 0,
        earningsLELtoPT: row.earnings_lel_to_pt_this_period || 0,
        earningsPTtoUEL: row.earnings_pt_to_uel_this_period || 0,
        earningsAboveUEL: row.earnings_above_uel_this_period || 0,
        employeeNIC: row.nic_employee_this_period || 0,
        employerNIC: row.nic_employer_this_period || 0,
        taxCode: row.tax_code || "",
        grossPay: row.gross_pay_this_period || 0,
        taxablePay: row.taxable_pay_this_period || 0,
        incomeTax: row.income_tax_this_period || 0,
        employeePension: row.employee_pension_this_period || 0,
        studentLoan: row.student_loan_this_period || 0,
        nhsPensionEmployee: row.nhs_pension_employee_this_period || 0,
      }));

      // Get YTD totals from the latest period
      const latestPeriod = payrollData && payrollData.length > 0 
        ? payrollData[payrollData.length - 1] 
        : null;

      const ytdTotals: P11YTDTotals = {
        grossPayYTD: latestPeriod?.gross_pay_ytd || 0,
        taxablePayYTD: latestPeriod?.taxable_pay_ytd || 0,
        incomeTaxYTD: latestPeriod?.income_tax_ytd || 0,
        employeeNICYTD: latestPeriod?.nic_employee_ytd || 0,
        employerNICYTD: latestPeriod?.nic_employer_ytd || 0,
        employeePensionYTD: latestPeriod?.employee_pension_ytd || 0,
        employerPensionYTD: latestPeriod?.employer_pension_ytd || 0,
        studentLoanYTD: latestPeriod?.student_loan_ytd || 0,
        nhsPensionEmployeeYTD: latestPeriod?.nhs_pension_employee_ytd || 0,
        nhsPensionEmployerYTD: latestPeriod?.nhs_pension_employer_ytd || 0,
        freePayYTD: latestPeriod?.free_pay_ytd || 0,
        netPayYTD: latestPeriod?.net_pay_ytd || 0,
      };

      setReportData({
        employee: {
          id: employeeData.id,
          firstName: employeeData.first_name,
          lastName: employeeData.last_name,
          niNumber: employeeData.national_insurance_number,
          dateOfBirth: employeeData.date_of_birth,
          hireDate: employeeData.hire_date,
          leaveDate: employeeData.leave_date,
          department: employeeData.department,
          payrollId: employeeData.payroll_id,
        },
        company: {
          name: companyData.name,
          payeRef: companyData.paye_ref,
          accountsOfficeNumber: companyData.accounts_office_number,
        },
        taxYear,
        periods,
        ytdTotals,
      });
    } catch (err) {
      console.error("Error fetching P11 report:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch P11 report");
    } finally {
      setLoading(false);
    }
  };

  return {
    reportData,
    loading,
    error,
    fetchReport,
  };
}
