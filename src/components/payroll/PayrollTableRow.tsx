import { TableCell, TableRow } from '@/components/ui/table';
import { PayrollTableRow as PayrollRowData } from './hooks/usePayrollTableData';
import { formatPounds } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface PayrollTableRowProps {
  row: PayrollRowData;
  index: number;
}

export function PayrollTableRowComponent({ row, index }: PayrollTableRowProps) {
  const formatCurrency = (value: number) => {
    if (value === 0) return '-';
    return formatPounds(value);
  };

  return (
    <TableRow className={cn(index % 2 === 0 ? 'bg-background' : 'bg-muted/30')}>
      <TableCell className="font-medium whitespace-nowrap">{row.payrollId || '-'}</TableCell>
      <TableCell className="whitespace-nowrap">{row.name}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(row.salary)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(row.statutoryPayment)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(row.overtime)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(row.ssp)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(row.extraPayments)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(row.extraDeductions)}</TableCell>
      <TableCell className="text-right tabular-nums font-medium">{formatCurrency(row.gross)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(row.tax)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(row.employeeNic)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(row.employerNic)}</TableCell>
      <TableCell className="text-right tabular-nums">
        {formatCurrency(row.pensionablePay)} / {formatCurrency(row.pension)}
      </TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(row.studentLoan)}</TableCell>
      <TableCell className="text-right tabular-nums font-medium text-primary">
        {formatCurrency(row.amountPaid)}
      </TableCell>
      <TableCell className="max-w-[150px] truncate">{row.notes || '-'}</TableCell>
    </TableRow>
  );
}
