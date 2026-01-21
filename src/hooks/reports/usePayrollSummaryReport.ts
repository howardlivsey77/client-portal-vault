import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/providers";
import { getCurrentPayPeriod, getFinancialYearForDate } from "@/services/payroll/utils/financial-year-utils";

export interface PayrollSummaryRecord {
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string | null;
  costCentre: string | null;
  grossPay: number;
  overtimeHours: number;
  overtimeValue: number;
  tax: number;
  employeeNic: number;
  studentLoan: number;
  netPay: number;
  employerNic: number;
  expenseReimbursements: number;
  employeePension: number;
  employerPension: number;
}

export interface PayrollSummaryTotals {
  grossPay: number;
  overtimeHours: number;
  overtimeValue: number;
  tax: number;
  employeeNic: number;
  studentLoan: number;
  netPay: number;
  employerNic: number;
  expenseReimbursements: number;
  employeePension: number;
  employerPension: number;
  costToEmployer: number;
}

export interface PayrollSummaryFilters {
  financialYear: string;
  periodNumber: number;
  department?: string;
}

export interface PayrollSummaryReportData {
  records: PayrollSummaryRecord[];
  totals: PayrollSummaryTotals;
  departments: string[];
}

const PERIOD_MONTHS = [
  "April", "May", "June", "July", "August", "September",
  "October", "November", "December", "January", "February", "March"
];

export function getPeriodMonthName(periodNumber: number): string {
  return PERIOD_MONTHS[(periodNumber - 1) % 12] || `Period ${periodNumber}`;
}

export function usePayrollSummaryReport() {
  const { currentCompany } = useCompany();
  const companyId = currentCompany?.id;

  // Initialize with current period as fallback
  const currentDate = new Date();
  const currentFinancialYear = getFinancialYearForDate(currentDate);
  const currentPeriod = getCurrentPayPeriod(currentDate);

  const [filters, setFilters] = useState<PayrollSummaryFilters>({
    financialYear: currentFinancialYear.description,
    periodNumber: currentPeriod.periodNumber,
  });

  const [hasInitialized, setHasInitialized] = useState(false);

  // Fetch the most recent period with payroll data
  const { data: latestPeriodData } = useQuery({
    queryKey: ["payroll-latest-period", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      
      const { data, error } = await supabase
        .from("payroll_results")
        .select("tax_year, tax_period")
        .eq("company_id", companyId)
        .order("tax_year", { ascending: false })
        .order("tax_period", { ascending: false })
        .limit(1);
      
      if (error || !data || data.length === 0) return null;
      return { taxYear: data[0].tax_year, taxPeriod: data[0].tax_period };
    },
    enabled: !!companyId,
  });

  // Initialize filters to the latest period with data
  useEffect(() => {
    if (latestPeriodData && !hasInitialized) {
      setFilters({
        financialYear: latestPeriodData.taxYear,
        periodNumber: latestPeriodData.taxPeriod,
      });
      setHasInitialized(true);
    }
  }, [latestPeriodData, hasInitialized]);

  // Fetch payroll results with employee data
  const { data: payrollData, isLoading: isLoadingPayroll, refetch } = useQuery({
    queryKey: ["payroll-summary-report", companyId, filters.financialYear, filters.periodNumber],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from("payroll_results")
        .select(`
          id,
          employee_id,
          gross_pay_this_period,
          income_tax_this_period,
          nic_employee_this_period,
          student_loan_this_period,
          net_pay_this_period,
          nic_employer_this_period,
          employee_pension_this_period,
          nhs_pension_employee_this_period,
          employer_pension_this_period,
          nhs_pension_employer_this_period,
          employees!inner (
            payroll_id,
            first_name,
            last_name,
            department,
            cost_centre
          )
        `)
        .eq("company_id", companyId)
        .eq("tax_year", filters.financialYear)
        .eq("tax_period", filters.periodNumber);

      if (error) {
        console.error("Error fetching payroll results:", error);
        throw error;
      }

      return data;
    },
    enabled: !!companyId,
  });

  // Fetch overtime data from payroll_employee_details
  const { data: overtimeData, isLoading: isLoadingOvertime } = useQuery({
    queryKey: ["payroll-overtime-data", companyId, filters.financialYear, filters.periodNumber],
    queryFn: async () => {
      if (!companyId) return null;

      // Get payroll periods for this company/year/period
      const { data: periods, error: periodsError } = await supabase
        .from("payroll_periods")
        .select("id")
        .eq("company_id", companyId)
        .eq("financial_year", parseInt(filters.financialYear.split("/")[0], 10))
        .eq("period_number", filters.periodNumber);

      if (periodsError) {
        console.error("Error fetching payroll periods:", periodsError);
        return {};
      }

      if (!periods || periods.length === 0) return {};

      const periodIds = periods.map(p => p.id);

      // Get employee details for these periods
      const { data: details, error: detailsError } = await supabase
        .from("payroll_employee_details")
        .select("employee_id, payroll_id, extra_hours, rate_value")
        .in("payroll_period_id", periodIds);

      if (detailsError) {
        console.error("Error fetching employee details:", detailsError);
        return {};
      }

      // Aggregate overtime by employee
      const overtimeByEmployee: Record<string, { hours: number; value: number }> = {};
      
      for (const detail of details || []) {
        const key = detail.employee_id || detail.payroll_id || "";
        if (!key) continue;

        if (!overtimeByEmployee[key]) {
          overtimeByEmployee[key] = { hours: 0, value: 0 };
        }
        
        const hours = Number(detail.extra_hours) || 0;
        const rate = Number(detail.rate_value) || 0;
        
        overtimeByEmployee[key].hours += hours;
        overtimeByEmployee[key].value += hours * rate;
      }

      return overtimeByEmployee;
    },
    enabled: !!companyId,
  });

  // Fetch expense reimbursements from payroll_import_audit
  const { data: expenseData, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ["payroll-expenses-data", companyId, filters.financialYear, filters.periodNumber],
    queryFn: async () => {
      if (!companyId) return {};

      const { data, error } = await supabase
        .from("payroll_import_audit")
        .select("employee_id, imported_value")
        .eq("company_id", companyId)
        .eq("financial_year", parseInt(filters.financialYear.split("/")[0], 10))
        .eq("period_number", filters.periodNumber)
        .eq("import_type", "expenses");

      if (error) {
        console.error("Error fetching expense data:", error);
        return {};
      }

      // Aggregate expenses by employee
      const expensesByEmployee: Record<string, number> = {};
      
      for (const item of data || []) {
        if (!item.employee_id) continue;
        expensesByEmployee[item.employee_id] = (expensesByEmployee[item.employee_id] || 0) + (Number(item.imported_value) || 0);
      }

      return expensesByEmployee;
    },
    enabled: !!companyId,
  });

  // Process and combine all data
  const reportData = useMemo((): PayrollSummaryReportData => {
    if (!payrollData) {
      return { records: [], totals: getEmptyTotals(), departments: [] };
    }

    const departmentSet = new Set<string>();
    const records: PayrollSummaryRecord[] = [];

    for (const row of payrollData) {
      const employee = row.employees as { 
        payroll_id: string | null;
        first_name: string;
        last_name: string;
        department: string | null;
        cost_centre: string | null;
      };

      if (!employee) continue;

      const employeeKey = employee.payroll_id || row.employee_id || "";
      const overtime = overtimeData?.[employeeKey] || { hours: 0, value: 0 };
      const expenses = expenseData?.[row.employee_id] || 0;

      if (employee.department) {
        departmentSet.add(employee.department);
      }

      // Convert from pence to pounds
      const record: PayrollSummaryRecord = {
        employeeId: employee.payroll_id || "",
        firstName: employee.first_name,
        lastName: employee.last_name,
        department: employee.department,
        costCentre: employee.cost_centre,
        grossPay: (row.gross_pay_this_period || 0) / 100,
        overtimeHours: overtime.hours,
        overtimeValue: overtime.value / 100,
        tax: (row.income_tax_this_period || 0) / 100,
        employeeNic: (row.nic_employee_this_period || 0) / 100,
        studentLoan: (row.student_loan_this_period || 0) / 100,
        netPay: (row.net_pay_this_period || 0) / 100,
        employerNic: (row.nic_employer_this_period || 0) / 100,
        expenseReimbursements: expenses / 100,
        employeePension: ((row.employee_pension_this_period || 0) + (row.nhs_pension_employee_this_period || 0)) / 100,
        employerPension: ((row.employer_pension_this_period || 0) + (row.nhs_pension_employer_this_period || 0)) / 100,
      };

      records.push(record);
    }

    // Apply department filter
    const filteredRecords = filters.department
      ? records.filter(r => r.department === filters.department)
      : records;

    // Calculate totals
    const totals = calculateTotals(filteredRecords);

    return {
      records: filteredRecords,
      totals,
      departments: Array.from(departmentSet).sort(),
    };
  }, [payrollData, overtimeData, expenseData, filters.department]);

  const loading = isLoadingPayroll || isLoadingOvertime || isLoadingExpenses;

  return {
    reportData: reportData.records,
    totals: reportData.totals,
    departments: reportData.departments,
    loading,
    filters,
    setFilters,
    refreshData: refetch,
  };
}

function getEmptyTotals(): PayrollSummaryTotals {
  return {
    grossPay: 0,
    overtimeHours: 0,
    overtimeValue: 0,
    tax: 0,
    employeeNic: 0,
    studentLoan: 0,
    netPay: 0,
    employerNic: 0,
    expenseReimbursements: 0,
    employeePension: 0,
    employerPension: 0,
    costToEmployer: 0,
  };
}

function calculateTotals(records: PayrollSummaryRecord[]): PayrollSummaryTotals {
  const base = records.reduce(
    (acc, record) => ({
      grossPay: acc.grossPay + record.grossPay,
      overtimeHours: acc.overtimeHours + record.overtimeHours,
      overtimeValue: acc.overtimeValue + record.overtimeValue,
      tax: acc.tax + record.tax,
      employeeNic: acc.employeeNic + record.employeeNic,
      studentLoan: acc.studentLoan + record.studentLoan,
      netPay: acc.netPay + record.netPay,
      employerNic: acc.employerNic + record.employerNic,
      expenseReimbursements: acc.expenseReimbursements + record.expenseReimbursements,
      employeePension: acc.employeePension + record.employeePension,
      employerPension: acc.employerPension + record.employerPension,
    }),
    {
      grossPay: 0,
      overtimeHours: 0,
      overtimeValue: 0,
      tax: 0,
      employeeNic: 0,
      studentLoan: 0,
      netPay: 0,
      employerNic: 0,
      expenseReimbursements: 0,
      employeePension: 0,
      employerPension: 0,
    }
  );

  // Calculate cost to employer: Gross + Employer NIC + Employer Pension
  return {
    ...base,
    costToEmployer: base.grossPay + base.employerNic + base.employerPension,
  };
}
