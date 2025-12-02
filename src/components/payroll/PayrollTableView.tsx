import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PayrollTableHeader } from './PayrollTableHeader';
import { PayrollTableRowComponent } from './PayrollTableRow';
import { usePayrollTableData, PayrollTotals } from './hooks/usePayrollTableData';
import { PayPeriod } from '@/services/payroll/utils/financial-year-utils';
import { formatPounds } from '@/lib/formatters';

interface PayrollTableViewProps {
  payPeriod: PayPeriod;
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
  } = usePayrollTableData(payPeriod);

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
                  <PayrollTableRowComponent key={row.employeeId} row={row} index={index} />
                ))}
                
                {/* Department Subtotal Row */}
                {renderSubtotalRow(group.subtotals, `${group.department} Total`)}
              </React.Fragment>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/70 font-medium">
              <TableCell colSpan={2}>Totals</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(totals.salary)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(totals.statutoryPayment)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(totals.overtime)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(totals.ssp)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(totals.extraPayments)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(totals.extraDeductions)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(totals.gross)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(totals.tax)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(totals.employeeNic)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(totals.pensionablePay)} / {formatCurrency(totals.pension)}
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(totals.studentLoan)}</TableCell>
              <TableCell className="text-right tabular-nums font-bold text-primary">
                {formatCurrency(totals.amountPaid)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
