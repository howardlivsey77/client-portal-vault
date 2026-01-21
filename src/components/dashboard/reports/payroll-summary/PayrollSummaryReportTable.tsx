import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PayrollSummaryRecord, PayrollSummaryTotals } from "@/hooks/reports/usePayrollSummaryReport";
import { formatCurrency } from "@/lib/formatters";

interface PayrollSummaryReportTableProps {
  data: PayrollSummaryRecord[];
  totals: PayrollSummaryTotals;
  loading: boolean;
}

function formatHours(hours: number): string {
  return hours.toFixed(2);
}

export function PayrollSummaryReportTable({
  data,
  totals,
  loading,
}: PayrollSummaryReportTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No payroll data found for the selected period.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="whitespace-nowrap font-semibold">Employee ID</TableHead>
              <TableHead className="whitespace-nowrap font-semibold">First Name</TableHead>
              <TableHead className="whitespace-nowrap font-semibold">Surname</TableHead>
              <TableHead className="whitespace-nowrap font-semibold">Department</TableHead>
              <TableHead className="whitespace-nowrap font-semibold">Cost Centre</TableHead>
              <TableHead className="whitespace-nowrap font-semibold text-right">Gross Pay</TableHead>
              <TableHead className="whitespace-nowrap font-semibold text-right">OT Hours</TableHead>
              <TableHead className="whitespace-nowrap font-semibold text-right">OT Value</TableHead>
              <TableHead className="whitespace-nowrap font-semibold text-right">Tax</TableHead>
              <TableHead className="whitespace-nowrap font-semibold text-right">Employee NIC</TableHead>
              <TableHead className="whitespace-nowrap font-semibold text-right">Student Loan</TableHead>
              <TableHead className="whitespace-nowrap font-semibold text-right">Net Pay</TableHead>
              <TableHead className="whitespace-nowrap font-semibold text-right">Employer NIC</TableHead>
              <TableHead className="whitespace-nowrap font-semibold text-right">Expenses</TableHead>
              <TableHead className="whitespace-nowrap font-semibold text-right">Ee Pension</TableHead>
              <TableHead className="whitespace-nowrap font-semibold text-right">Er Pension</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((record, index) => (
              <TableRow key={`${record.employeeId}-${index}`} className="hover:bg-muted/30">
                <TableCell className="font-medium">{record.employeeId || "-"}</TableCell>
                <TableCell>{record.firstName}</TableCell>
                <TableCell>{record.lastName}</TableCell>
                <TableCell>{record.department || "-"}</TableCell>
                <TableCell>{record.costCentre || "-"}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(record.grossPay)}</TableCell>
                <TableCell className="text-right font-mono">{formatHours(record.overtimeHours)}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(record.overtimeValue)}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(record.tax)}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(record.employeeNic)}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(record.studentLoan)}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(record.netPay)}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(record.employerNic)}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(record.expenseReimbursements)}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(record.employeePension)}</TableCell>
                <TableCell className="text-right font-mono">{formatCurrency(record.employerPension)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted font-semibold">
              <TableCell colSpan={5} className="text-right">Totals</TableCell>
              <TableCell className="text-right font-mono">{formatCurrency(totals.grossPay)}</TableCell>
              <TableCell className="text-right font-mono">{formatHours(totals.overtimeHours)}</TableCell>
              <TableCell className="text-right font-mono">{formatCurrency(totals.overtimeValue)}</TableCell>
              <TableCell className="text-right font-mono">{formatCurrency(totals.tax)}</TableCell>
              <TableCell className="text-right font-mono">{formatCurrency(totals.employeeNic)}</TableCell>
              <TableCell className="text-right font-mono">{formatCurrency(totals.studentLoan)}</TableCell>
              <TableCell className="text-right font-mono">{formatCurrency(totals.netPay)}</TableCell>
              <TableCell className="text-right font-mono">{formatCurrency(totals.employerNic)}</TableCell>
              <TableCell className="text-right font-mono">{formatCurrency(totals.expenseReimbursements)}</TableCell>
              <TableCell className="text-right font-mono">{formatCurrency(totals.employeePension)}</TableCell>
              <TableCell className="text-right font-mono">{formatCurrency(totals.employerPension)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
