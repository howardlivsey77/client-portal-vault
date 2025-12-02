import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/providers/CompanyProvider';
import { useToast } from '@/hooks/use-toast';
import { PayPeriod } from '@/services/payroll/utils/financial-year-utils';
import { Employee } from '@/types/employee-types';

// Helper to get payroll period date from PayPeriod
function getPayPeriodDate(payPeriod: PayPeriod): string {
  // UK Financial year starts in April (month 4)
  // Period 1 = April, Period 2 = May, etc.
  const monthIndex = ((payPeriod.periodNumber - 1 + 3) % 12); // Convert period to month (0-indexed)
  const year = payPeriod.periodNumber <= 9 ? payPeriod.year : payPeriod.year + 1;
  const date = new Date(year, monthIndex, 1);
  return date.toISOString().split('T')[0];
}

export interface PayrollTableRow {
  employeeId: string;
  payrollId: string;
  name: string;
  department: string;
  salary: number;
  statutoryPayment: number;
  overtime: number;
  ssp: number;
  extraPayments: number;
  extraDeductions: number;
  gross: number;
  tax: number;
  employeeNic: number;
  employerNic: number;
  pensionablePay: number;
  pension: number;
  studentLoan: number;
  amountPaid: number;
  notes: string;
  hasPayrollResult: boolean;
}

export interface PayrollTotals {
  salary: number;
  statutoryPayment: number;
  overtime: number;
  ssp: number;
  extraPayments: number;
  extraDeductions: number;
  gross: number;
  tax: number;
  employeeNic: number;
  employerNic: number;
  pensionablePay: number;
  pension: number;
  studentLoan: number;
  amountPaid: number;
}

export interface DepartmentGroup {
  department: string;
  rows: PayrollTableRow[];
  subtotals: PayrollTotals;
}

export type SortField = 'payrollId' | 'name';

export function usePayrollTableData(payPeriod: PayPeriod) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollResults, setPayrollResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortField>('payrollId');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(undefined);
  const { currentCompany } = useCompany();
  const { toast } = useToast();

  // Fetch employees and payroll results
  useEffect(() => {
    const fetchData = async () => {
      if (!currentCompany?.id) {
        setEmployees([]);
        setPayrollResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const periodDate = getPayPeriodDate(payPeriod);
        
        // Fetch employees
        const { data: empData, error: empError } = await supabase
          .from('employees')
          .select('*')
          .eq('company_id', currentCompany.id)
          .eq('status', 'active');

        if (empError) throw empError;

        // Fetch payroll results for this period
        const { data: payrollData, error: payrollError } = await supabase
          .from('payroll_results')
          .select('*')
          .eq('company_id', currentCompany.id)
          .eq('payroll_period', periodDate);

        if (payrollError) throw payrollError;

        setEmployees((empData as unknown as Employee[]) || []);
        setPayrollResults(payrollData || []);
      } catch (error: any) {
        console.error('Error fetching payroll table data:', error);
        toast({
          title: 'Error loading payroll data',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentCompany?.id, payPeriod.periodNumber, payPeriod.year]);

  // Combine employees with payroll results
  const tableData = useMemo((): PayrollTableRow[] => {
    return employees.map((emp) => {
      const payrollResult = payrollResults.find((pr) => pr.employee_id === emp.id);
      
      // Convert pennies to pounds for display (payroll_results stores values in pennies)
      const toPounds = (pennies: number | null) => (pennies || 0) / 100;
      
      return {
        employeeId: emp.id,
        payrollId: emp.payroll_id || '',
        name: `${emp.first_name} ${emp.last_name}`,
        department: emp.department || 'Unassigned',
        salary: emp.monthly_salary || 0,
        statutoryPayment: 0, // Future: SMP, SPP, etc.
        overtime: 0, // Future: calculated from timesheet data
        ssp: 0, // Future: Statutory Sick Pay
        extraPayments: 0, // Future: additional earnings
        extraDeductions: 0, // Future: additional deductions
        gross: payrollResult ? toPounds(payrollResult.gross_pay_this_period) : 0,
        tax: payrollResult ? toPounds(payrollResult.income_tax_this_period) : 0,
        employeeNic: payrollResult ? toPounds(payrollResult.nic_employee_this_period) : 0,
        employerNic: payrollResult ? toPounds(payrollResult.nic_employer_this_period) : 0,
        pensionablePay: payrollResult ? toPounds(payrollResult.gross_pay_this_period) : 0,
        pension: payrollResult 
          ? toPounds(payrollResult.employee_pension_this_period + (payrollResult.nhs_pension_employee_this_period || 0)) 
          : 0,
        studentLoan: payrollResult ? toPounds(payrollResult.student_loan_this_period) : 0,
        amountPaid: payrollResult ? toPounds(payrollResult.net_pay_this_period) : 0,
        notes: '', // Future: notes field
        hasPayrollResult: !!payrollResult,
      };
    });
  }, [employees, payrollResults]);

  // Sort the data
  const sortedData = useMemo(() => {
    return [...tableData].sort((a, b) => {
      if (sortBy === 'payrollId') {
        return (a.payrollId || '').localeCompare(b.payrollId || '', undefined, { numeric: true });
      }
      return a.name.localeCompare(b.name);
    });
  }, [tableData, sortBy]);

  // Helper function to calculate totals for a set of rows
  const calculateTotals = (rows: PayrollTableRow[]): PayrollTotals => {
    return rows.reduce(
      (acc, row) => ({
        salary: acc.salary + row.salary,
        statutoryPayment: acc.statutoryPayment + row.statutoryPayment,
        overtime: acc.overtime + row.overtime,
        ssp: acc.ssp + row.ssp,
        extraPayments: acc.extraPayments + row.extraPayments,
        extraDeductions: acc.extraDeductions + row.extraDeductions,
        gross: acc.gross + row.gross,
        tax: acc.tax + row.tax,
        employeeNic: acc.employeeNic + row.employeeNic,
        employerNic: acc.employerNic + row.employerNic,
        pensionablePay: acc.pensionablePay + row.pensionablePay,
        pension: acc.pension + row.pension,
        studentLoan: acc.studentLoan + row.studentLoan,
        amountPaid: acc.amountPaid + row.amountPaid,
      }),
      {
        salary: 0,
        statutoryPayment: 0,
        overtime: 0,
        ssp: 0,
        extraPayments: 0,
        extraDeductions: 0,
        gross: 0,
        tax: 0,
        employeeNic: 0,
        employerNic: 0,
        pensionablePay: 0,
        pension: 0,
        studentLoan: 0,
        amountPaid: 0,
      }
    );
  };

  // Group data by department
  const groupedData = useMemo((): DepartmentGroup[] => {
    const departmentMap = new Map<string, PayrollTableRow[]>();
    
    // Group employees by department
    sortedData.forEach((row) => {
      const dept = row.department;
      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, []);
      }
      departmentMap.get(dept)!.push(row);
    });
    
    // Convert to array and sort departments alphabetically (but put 'Unassigned' last)
    const departments = Array.from(departmentMap.keys()).sort((a, b) => {
      if (a === 'Unassigned') return 1;
      if (b === 'Unassigned') return -1;
      return a.localeCompare(b);
    });
    
    return departments.map((dept) => {
      const rows = departmentMap.get(dept)!;
      return {
        department: dept,
        rows,
        subtotals: calculateTotals(rows),
      };
    });
  }, [sortedData]);

  // Calculate grand totals
  const totals = useMemo(() => calculateTotals(sortedData), [sortedData]);

  return {
    data: sortedData,
    groupedData,
    totals,
    loading,
    sortBy,
    setSortBy,
    paymentDate,
    setPaymentDate,
    refetch: () => {
      // Trigger refetch by updating state
      setLoading(true);
    },
  };
}
