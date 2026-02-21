import { useState, useEffect, useMemo, useCallback } from 'react';
import { lastDayOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/providers/CompanyProvider';
import { useToast } from '@/hooks';
import { PayPeriod } from '@/services/payroll/utils/financial-year-utils';
import { Employee } from "@/types";
import { calculateMonthlySalary } from '@/lib/formatters';
import { calculateMonthlyIncomeTaxAsync } from '@/services/payroll/calculations/income-tax';
import { calculateNationalInsuranceAsync } from '@/services/payroll/calculations/national-insurance';
import { calculateStudentLoan } from '@/services/payroll/calculations/student-loan';
import { OvertimeItem } from '../adjustments/types';

// Helper to get the last day of the pay period month
function getLastDayOfPayPeriod(payPeriod: PayPeriod): Date {
  // UK Financial year: Period 1 = April, Period 2 = May, etc.
  const monthIndex = ((payPeriod.periodNumber - 1 + 3) % 12); // 0-indexed
  const year = payPeriod.periodNumber <= 9 ? payPeriod.year : payPeriod.year + 1;
  const dateInMonth = new Date(year, monthIndex, 1);
  return lastDayOfMonth(dateInMonth);
}
interface CalculatedPayroll {
  tax: number;
  nic: number;
  gross: number;
  studentLoan: number;
}

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
  // Employee-specific fields for payroll calculation
  taxCode: string;
  studentLoanPlan: 1 | 2 | 4 | 'PGL' | null;
  isNHSPensionMember: boolean;
  pensionPercentage: number;
  previousYearPensionablePay: number | null;
  // Sickness days for display
  fullPaySickDays: number;
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
  const [sicknessRecords, setSicknessRecords] = useState<any[]>([]);
  const [overtimeData, setOvertimeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortField>('payrollId');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(() => getLastDayOfPayPeriod(payPeriod));
  const [calculatedPayroll, setCalculatedPayroll] = useState<Map<string, CalculatedPayroll>>(new Map());
  const { currentCompany } = useCompany();
  const { toast } = useToast();

  // Update payment date when pay period changes
  useEffect(() => {
    setPaymentDate(getLastDayOfPayPeriod(payPeriod));
  }, [payPeriod.periodNumber, payPeriod.year]);

  // Helper to calculate pay period date range
  const getPayPeriodDateRange = (period: PayPeriod) => {
    const monthIndex = ((period.periodNumber - 1 + 3) % 12);
    const year = period.periodNumber <= 9 ? period.year : period.year + 1;
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = lastDayOfMonth(firstDay);
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
    };
  };

  // Fetch employees, payroll results, and sickness records
  useEffect(() => {
    const fetchData = async () => {
      if (!currentCompany?.id) {
        setEmployees([]);
        setPayrollResults([]);
        setSicknessRecords([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const periodDate = getPayPeriodDate(payPeriod);
        const { start: periodStart, end: periodEnd } = getPayPeriodDateRange(payPeriod);
        
        // Fetch employees, payroll results, and sickness records first
        const [empResponse, payrollResponse, sicknessResponse] = await Promise.all([
          supabase
            .from('employees')
            .select('*')
            .eq('company_id', currentCompany.id)
            .eq('status', 'active'),
          supabase
            .from('payroll_results')
            .select('*')
            .eq('company_id', currentCompany.id)
            .eq('payroll_period', periodDate),
          supabase
            .from('employee_sickness_records')
            .select('employee_id, total_days, start_date, end_date')
            .eq('company_id', currentCompany.id)
            .lte('start_date', periodEnd)
            .or(`end_date.gte.${periodStart},end_date.is.null`),
        ]);

        if (empResponse.error) throw empResponse.error;
        if (payrollResponse.error) throw payrollResponse.error;
        if (sicknessResponse.error) throw sicknessResponse.error;

        // Now fetch overtime data using a two-step query approach
        let overtimeRecords: any[] = [];
        
        // First, find the payroll period ID for this company/period/year
        const { data: periodResult } = await supabase
          .from('payroll_periods')
          .select('id')
          .eq('company_id', currentCompany.id)
          .eq('period_number', payPeriod.periodNumber)
          .eq('financial_year', payPeriod.year)
          .maybeSingle();
        
        // If we found a period, fetch the employee details
        if (periodResult?.id) {
          const { data: overtimeData } = await supabase
            .from('payroll_employee_details')
            .select('employee_id, employee_name, extra_hours, rate_type, rate_value')
            .eq('payroll_period_id', periodResult.id);
          
          overtimeRecords = overtimeData || [];
        }

        setEmployees((empResponse.data as unknown as Employee[]) || []);
        setPayrollResults(payrollResponse.data || []);
        setSicknessRecords(sicknessResponse.data || []);
        setOvertimeData(overtimeRecords);
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

  // Calculate tax and NIC for employees without payroll results
  useEffect(() => {
    const calculatePayrollForEmployees = async () => {
      if (employees.length === 0) return;

      const newCalculations = new Map<string, CalculatedPayroll>();
      
      // Get current tax year based on pay period
      const taxYear = `${payPeriod.year}/${(payPeriod.year + 1).toString().substring(2)}`;

      for (const emp of employees) {
        // Skip if already has payroll result
        const hasPayrollResult = payrollResults.some(pr => pr.employee_id === emp.id);
        if (hasPayrollResult) continue;

        const monthlySalary = calculateMonthlySalary(emp.hourly_rate || 0, emp.hours_per_week || 0);
        const taxCode = emp.tax_code || '1257L';

        try {
          // Calculate tax and NIC in parallel
          const [taxResult, niResult] = await Promise.all([
            calculateMonthlyIncomeTaxAsync(monthlySalary, taxCode, taxYear),
            calculateNationalInsuranceAsync(monthlySalary, taxYear)
          ]);

          // Calculate student loan (synchronous - uses hardcoded thresholds)
          const studentLoanPlan = emp.student_loan_plan === 6 ? 'PGL' as const :
            (emp.student_loan_plan as 1 | 2 | 4 | null);
          const studentLoanDeduction = calculateStudentLoan(monthlySalary, studentLoanPlan);

          newCalculations.set(emp.id, {
            tax: taxResult.monthlyTax,
            nic: niResult.nationalInsurance,
            gross: monthlySalary,
            studentLoan: studentLoanDeduction
          });
        } catch (error) {
          console.error(`Error calculating payroll for ${emp.first_name} ${emp.last_name}:`, error);
          // Set defaults on error
          newCalculations.set(emp.id, { tax: 0, nic: 0, gross: monthlySalary, studentLoan: 0 });
        }
      }

      setCalculatedPayroll(newCalculations);
    };

    calculatePayrollForEmployees();
  }, [employees, payrollResults, payPeriod.year]);

  // Calculate sick days per employee for the current period
  const sickDaysMap = useMemo(() => {
    const map = new Map<string, number>();
    const { start: periodStart, end: periodEnd } = getPayPeriodDateRange(payPeriod);
    const periodStartDate = new Date(periodStart);
    const periodEndDate = new Date(periodEnd);

    sicknessRecords.forEach(record => {
      const recordStart = new Date(record.start_date);
      const recordEnd = record.end_date ? new Date(record.end_date) : recordStart;

      // Calculate overlap with pay period
      const overlapStart = recordStart > periodStartDate ? recordStart : periodStartDate;
      const overlapEnd = recordEnd < periodEndDate ? recordEnd : periodEndDate;

      if (overlapStart <= overlapEnd) {
        const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const current = map.get(record.employee_id) || 0;
        map.set(record.employee_id, current + overlapDays);
      }
    });

    return map;
  }, [sicknessRecords, payPeriod]);

  // Calculate overtime totals per employee from imported data
  const overtimeMap = useMemo(() => {
    const map = new Map<string, { hours: number; amount: number }>();
    
    overtimeData.forEach(record => {
      // Match by employee_id first, then by employee_name
      const employeeKey = record.employee_id || record.employee_name;
      if (!employeeKey) return;
      
      const hours = record.extra_hours || 0;
      const rate = record.rate_value || 0;
      const amount = hours * rate;
      
      const existing = map.get(employeeKey) || { hours: 0, amount: 0 };
      map.set(employeeKey, {
        hours: existing.hours + hours,
        amount: existing.amount + amount
      });
    });
    
    return map;
  }, [overtimeData]);

  // Create overtimeItemsMap that returns OvertimeItem[] per employee for the dialog
  const overtimeItemsMap = useMemo(() => {
    const map = new Map<string, OvertimeItem[]>();
    
    overtimeData.forEach(record => {
      const employeeKey = record.employee_id || record.employee_name;
      if (!employeeKey) return;
      
      const hours = record.extra_hours || 0;
      const rate = record.rate_value || 0;
      
      const item: OvertimeItem = {
        id: crypto.randomUUID(),
        hours: hours,
        rateMultiplier: 1, // Imported data uses direct rate, so multiplier is 1
        hourlyRate: rate,
        amount: hours * rate
      };
      
      const existing = map.get(employeeKey) || [];
      map.set(employeeKey, [...existing, item]);
    });
    
    return map;
  }, [overtimeData]);

  // Combine employees with payroll results
  const tableData = useMemo((): PayrollTableRow[] => {
    return employees.map((emp) => {
      const payrollResult = payrollResults.find((pr) => pr.employee_id === emp.id);
      const calculatedValues = calculatedPayroll.get(emp.id);
      const fullPaySickDays = sickDaysMap.get(emp.id) || 0;
      
      // Convert pennies to pounds for display (payroll_results stores values in pennies)
      const toPounds = (pennies: number | null) => (pennies || 0) / 100;
      const monthlySalary = calculateMonthlySalary(emp.hourly_rate || 0, emp.hours_per_week || 0);
      
      // Get overtime from imported data - try by ID first, then by name
      const employeeName = `${emp.first_name} ${emp.last_name}`;
      const overtimeEntry = overtimeMap.get(emp.id) || overtimeMap.get(employeeName);
      const overtimeAmount = overtimeEntry?.amount || 0;
      
      return {
        employeeId: emp.id,
        payrollId: emp.payroll_id || '',
        name: employeeName,
        department: emp.department || 'Unassigned',
        salary: monthlySalary,
        statutoryPayment: 0, // Future: SMP, SPP, etc.
        overtime: overtimeAmount,
        ssp: 0, // Future: Statutory Sick Pay
        extraPayments: 0, // Future: additional earnings
        extraDeductions: 0, // Future: additional deductions
        gross: payrollResult 
          ? toPounds(payrollResult.gross_pay_this_period) 
          : (calculatedValues?.gross || monthlySalary),
        tax: payrollResult 
          ? toPounds(payrollResult.income_tax_this_period) 
          : (calculatedValues?.tax || 0),
        employeeNic: payrollResult 
          ? toPounds(payrollResult.nic_employee_this_period) 
          : (calculatedValues?.nic || 0),
        employerNic: payrollResult ? toPounds(payrollResult.nic_employer_this_period) : 0,
        pensionablePay: payrollResult ? toPounds(payrollResult.gross_pay_this_period) : monthlySalary,
        pension: payrollResult 
          ? toPounds(payrollResult.employee_pension_this_period + (payrollResult.nhs_pension_employee_this_period || 0)) 
          : 0,
        studentLoan: payrollResult 
          ? toPounds(payrollResult.student_loan_this_period) 
          : (calculatedValues?.studentLoan || 0),
        amountPaid: payrollResult ? toPounds(payrollResult.net_pay_this_period) : 0,
        notes: '', // Future: notes field
        hasPayrollResult: !!payrollResult,
        // Employee-specific fields for payroll calculation
        taxCode: emp.tax_code || '1257L',
        studentLoanPlan: emp.student_loan_plan === 6 ? 'PGL' as const : (emp.student_loan_plan as 1 | 2 | 4 | null),
        isNHSPensionMember: emp.nhs_pension_member || false,
        pensionPercentage: 0, // Future: from employee record if available
        previousYearPensionablePay: emp.previous_year_pensionable_pay || null,
        fullPaySickDays,
      };
    });
  }, [employees, payrollResults, calculatedPayroll, sickDaysMap, overtimeMap]);

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

  // Build employee rates map for overtime dialogs
  const employeeRates = useMemo(() => {
    const ratesMap: Record<string, { hourlyRate: number; rate2: number | null; rate3: number | null; rate4: number | null }> = {};
    employees.forEach(emp => {
      ratesMap[emp.id] = {
        hourlyRate: emp.hourly_rate || 0,
        rate2: emp.rate_2 || null,
        rate3: emp.rate_3 || null,
        rate4: emp.rate_4 || null,
      };
    });
    return ratesMap;
  }, [employees]);

  // Refetch function that actually reloads data
  const refetch = useCallback(async () => {
    if (!currentCompany?.id) return;
    
    setLoading(true);
    try {
      const periodDate = getPayPeriodDate(payPeriod);
      
      const [empResponse, payrollResponse] = await Promise.all([
        supabase
          .from('employees')
          .select('*')
          .eq('company_id', currentCompany.id)
          .eq('status', 'active'),
        supabase
          .from('payroll_results')
          .select('*')
          .eq('company_id', currentCompany.id)
          .eq('payroll_period', periodDate)
      ]);

      if (empResponse.error) throw empResponse.error;
      if (payrollResponse.error) throw payrollResponse.error;

      setEmployees((empResponse.data as unknown as Employee[]) || []);
      setPayrollResults(payrollResponse.data || []);
    } catch (error: any) {
      console.error('Error refetching payroll data:', error);
      toast({
        title: 'Error refreshing data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id, payPeriod, toast]);

  return {
    data: sortedData,
    groupedData,
    totals,
    loading,
    sortBy,
    setSortBy,
    paymentDate,
    setPaymentDate,
    employeeRates,
    refetch,
    overtimeItemsMap,
  };
}
