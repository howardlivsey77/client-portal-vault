import React, { useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calculator, Loader2 } from 'lucide-react';
import { PayrollTableHeader } from './PayrollTableHeader';
import { PayrollTableRowComponent } from './PayrollTableRow';
import { usePayrollTableData, PayrollTotals } from './hooks/usePayrollTableData';
import { usePayrollBatchCalculation } from './hooks/usePayrollBatchCalculation';
import { PayPeriod } from '@/services/payroll/utils/financial-year-utils';
import { formatPounds } from '@/lib/formatters';
import { PayrollAdjustments, emptyAdjustments } from './adjustments';

interface PayrollTableViewProps {
  payPeriod: PayPeriod;
}

interface EmployeeRatesMap {
  [employeeId: string]: {
    hourlyRate: number;
    rate2: number | null;
    rate3: number | null;
    rate4: number | null;
  };
}

export function PayrollTableView({ payPeriod }: PayrollTableViewProps) {
  const {
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
  } = usePayrollTableData(payPeriod);

  // State to track adjustments per employee
  const [adjustmentsMap, setAdjustmentsMap] = useState<Record<string, PayrollAdjustments>>({});

  // Get adjustments for an employee, using imported overtime items if no manual adjustments exist
  const getEmployeeAdjustments = useCallback((employeeId: string, employeeName: string): PayrollAdjustments => {
    // If user has manually edited adjustments, use those
    if (adjustmentsMap[employeeId]) {
      return adjustmentsMap[employeeId];
    }
    
    // Otherwise, populate with imported overtime items
    const importedOvertime = overtimeItemsMap.get(employeeId) || overtimeItemsMap.get(employeeName) || [];
    
    if (importedOvertime.length > 0) {
      return {
        ...emptyAdjustments,
        overtime: importedOvertime,
      };
    }
    
    return emptyAdjustments;
  }, [adjustmentsMap, overtimeItemsMap]);

  const handleAdjustmentsChange = useCallback((employeeId: string, adjustments: PayrollAdjustments) => {
    setAdjustmentsMap(prev => ({
      ...prev,
      [employeeId]: adjustments,
    }));
  }, []);

  // Handle completion of batch calculation
  const handleBatchComplete = useCallback(() => {
    setAdjustmentsMap({}); // Clear adjustments after save
    refetch(); // Reload data
  }, [refetch]);

  const {
    calculateAndSaveAll,
    isProcessing,
    progress,
  } = usePayrollBatchCalculation(payPeriod, adjustmentsMap, groupedData, handleBatchComplete);

  // Calculate adjusted totals including adjustments
  const calculateAdjustedTotals = useCallback((baseTotals: PayrollTotals): PayrollTotals => {
    let adjustedTotals = { ...baseTotals };
    
    Object.values(adjustmentsMap).forEach(adj => {
      const overtimeTotal = adj.overtime.reduce((sum, item) => sum + item.amount, 0);
      const statutoryTotal = adj.statutoryPayment.reduce((sum, item) => sum + item.amount, 0);
      const sicknessTotal = adj.sickness.reduce((sum, item) => sum + item.amount, 0);
      const extraPaymentsTotal = adj.extraPayments.reduce((sum, item) => sum + item.amount, 0);
      const extraDeductionsTotal = adj.extraDeductions.reduce((sum, item) => sum + item.amount, 0);

      adjustedTotals.overtime += overtimeTotal;
      adjustedTotals.statutoryPayment += statutoryTotal;
      adjustedTotals.ssp += sicknessTotal;
      adjustedTotals.extraPayments += extraPaymentsTotal;
      adjustedTotals.extraDeductions += extraDeductionsTotal;
      adjustedTotals.gross += overtimeTotal + statutoryTotal + sicknessTotal + extraPaymentsTotal;
      adjustedTotals.amountPaid += overtimeTotal + statutoryTotal + sicknessTotal + extraPaymentsTotal - extraDeductionsTotal;
    });

    return adjustedTotals;
  }, [adjustmentsMap]);

  const formatCurrency = (value: number) => {
    if (value === 0) return '-';
    return formatPounds(value);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (groupedData.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/30 rounded-lg">
        <h3 className="text-xl font-medium mb-2">No Employees Found</h3>
        <p className="text-muted-foreground">
          Add employees to your company to see them in the payroll table.
        </p>
      </div>
    );
  }

  // Calculate adjusted subtotals for a department
  const calculateDepartmentSubtotals = (rows: typeof groupedData[0]['rows'], baseSubtotals: PayrollTotals): PayrollTotals => {
    let adjustedSubtotals = { ...baseSubtotals };
    
    rows.forEach(row => {
      const adj = adjustmentsMap[row.employeeId] || emptyAdjustments;
      const overtimeTotal = adj.overtime.reduce((sum, item) => sum + item.amount, 0);
      const statutoryTotal = adj.statutoryPayment.reduce((sum, item) => sum + item.amount, 0);
      const sicknessTotal = adj.sickness.reduce((sum, item) => sum + item.amount, 0);
      const extraPaymentsTotal = adj.extraPayments.reduce((sum, item) => sum + item.amount, 0);
      const extraDeductionsTotal = adj.extraDeductions.reduce((sum, item) => sum + item.amount, 0);

      adjustedSubtotals.overtime += overtimeTotal;
      adjustedSubtotals.statutoryPayment += statutoryTotal;
      adjustedSubtotals.ssp += sicknessTotal;
      adjustedSubtotals.extraPayments += extraPaymentsTotal;
      adjustedSubtotals.extraDeductions += extraDeductionsTotal;
      adjustedSubtotals.gross += overtimeTotal + statutoryTotal + sicknessTotal + extraPaymentsTotal;
      adjustedSubtotals.amountPaid += overtimeTotal + statutoryTotal + sicknessTotal + extraPaymentsTotal - extraDeductionsTotal;
    });

    return adjustedSubtotals;
  };

  const renderSubtotalRow = (subtotals: PayrollTotals, label: string) => (
    <TableRow className="bg-muted/40 font-medium border-b-2">
      <TableCell className="font-semibold">{label}</TableCell>
      <TableCell>—</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(subtotals.salary)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(subtotals.statutoryPayment)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(subtotals.overtime)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(subtotals.ssp)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(subtotals.extraPayments)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(subtotals.extraDeductions)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(subtotals.gross)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(subtotals.tax)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(subtotals.employeeNic)}</TableCell>
      <TableCell className="text-right tabular-nums">
        {formatCurrency(subtotals.pensionablePay)} / {formatCurrency(subtotals.pension)}
      </TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(subtotals.studentLoan)}</TableCell>
      <TableCell className="text-right tabular-nums font-bold">{formatCurrency(subtotals.amountPaid)}</TableCell>
    </TableRow>
  );

  const adjustedTotals = calculateAdjustedTotals(totals);

  return (
    <div className="space-y-4">
      <PayrollTableHeader
        sortBy={sortBy}
        onSortChange={setSortBy}
        paymentDate={paymentDate}
        onPaymentDateChange={setPaymentDate}
      />

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0">
            <TableRow>
              <TableHead className="min-w-[80px]">Payroll ID</TableHead>
              <TableHead className="min-w-[120px]">Name</TableHead>
              <TableHead className="text-right min-w-[80px]">Basic Salary</TableHead>
              <TableHead className="text-right min-w-[80px]">Statutory Payment</TableHead>
              <TableHead className="text-right min-w-[70px]">Overtime</TableHead>
              <TableHead className="text-right min-w-[70px]">Sickness</TableHead>
              <TableHead className="text-right min-w-[80px]">Extra Payments</TableHead>
              <TableHead className="text-right min-w-[80px]">Extra Deductions</TableHead>
              <TableHead className="text-right min-w-[80px]">Gross Salary</TableHead>
              <TableHead className="text-right min-w-[60px]">Tax</TableHead>
              <TableHead className="text-right min-w-[80px]">Employee NIC</TableHead>
              <TableHead className="text-right min-w-[100px]">Pensionable Pay/ Pension</TableHead>
              <TableHead className="text-right min-w-[80px]">Student Loan</TableHead>
              <TableHead className="text-right min-w-[80px]">Net Pay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedData.map((group) => (
              <React.Fragment key={group.department}>
                {/* Department Header Row */}
                <TableRow className="bg-primary/10 border-t-2 border-primary/20">
                  <TableCell colSpan={14} className="py-2 font-semibold text-base text-primary">
                    {group.department}
                  </TableCell>
                </TableRow>
                
                {/* Employee Rows */}
                {group.rows.map((row, index) => (
                  <PayrollTableRowComponent 
                    key={row.employeeId} 
                    row={row} 
                    index={index}
                    employeeRates={employeeRates[row.employeeId] || { hourlyRate: 0, rate2: null, rate3: null, rate4: null }}
                    adjustments={getEmployeeAdjustments(row.employeeId, row.name)}
                    onAdjustmentsChange={(adj) => handleAdjustmentsChange(row.employeeId, adj)}
                    payPeriod={`Period ${payPeriod.periodNumber} - ${payPeriod.year}/${payPeriod.year + 1}`}
                    payPeriodData={{ periodNumber: payPeriod.periodNumber, year: payPeriod.year }}
                  />
                ))}
                
                {/* Department Subtotal Row */}
                {renderSubtotalRow(calculateDepartmentSubtotals(group.rows, group.subtotals), `${group.department} Total`)}
              </React.Fragment>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/70 font-medium">
              <TableCell colSpan={2}>Totals</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(adjustedTotals.salary)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(adjustedTotals.statutoryPayment)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(adjustedTotals.overtime)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(adjustedTotals.ssp)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(adjustedTotals.extraPayments)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(adjustedTotals.extraDeductions)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(adjustedTotals.gross)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(adjustedTotals.tax)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(adjustedTotals.employeeNic)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(adjustedTotals.pensionablePay)} / {formatCurrency(adjustedTotals.pension)}
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(adjustedTotals.studentLoan)}</TableCell>
              <TableCell className="text-right tabular-nums font-bold text-primary">
                {formatCurrency(adjustedTotals.amountPaid)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Floating Calculate & Save Button */}
      <Button
        onClick={calculateAndSaveAll}
        disabled={isProcessing || loading}
        size="lg"
        className="fixed bottom-6 right-6 z-50 gap-2 shadow-lg hover:shadow-xl transition-shadow"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing {progress?.current}/{progress?.total}...
          </>
        ) : (
          <>
            <Calculator className="h-4 w-4" />
            Calculate & Save All
          </>
        )}
      </Button>
    </div>
  );
}
