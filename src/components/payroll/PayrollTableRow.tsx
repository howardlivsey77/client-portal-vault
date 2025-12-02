import { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { PayrollTableRow as PayrollRowData } from './hooks/usePayrollTableData';
import { formatPounds } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import {
  OvertimeDialog,
  StatutoryPaymentDialog,
  SicknessDialog,
  ExtraPaymentsDialog,
  ExtraDeductionsDialog,
  PayrollAdjustments,
  OvertimeItem,
  StatutoryPaymentItem,
  SicknessItem,
  ExtraPaymentItem,
  ExtraDeductionItem,
  emptyAdjustments,
} from './adjustments';

interface EmployeeRates {
  hourlyRate: number;
  rate2: number | null;
  rate3: number | null;
  rate4: number | null;
}

interface PayrollTableRowProps {
  row: PayrollRowData;
  index: number;
  employeeRates: EmployeeRates;
  adjustments: PayrollAdjustments;
  onAdjustmentsChange: (adjustments: PayrollAdjustments) => void;
}

type DialogType = 'overtime' | 'statutory' | 'sickness' | 'extraPayments' | 'extraDeductions' | null;

export function PayrollTableRowComponent({ 
  row, 
  index, 
  employeeRates,
  adjustments,
  onAdjustmentsChange,
}: PayrollTableRowProps) {
  const [openDialog, setOpenDialog] = useState<DialogType>(null);

  const formatCurrency = (value: number) => {
    if (value === 0) return '-';
    return formatPounds(value);
  };

  // Calculate totals from adjustments
  const overtimeTotal = adjustments.overtime.reduce((sum, item) => sum + item.amount, 0);
  const statutoryTotal = adjustments.statutoryPayment.reduce((sum, item) => sum + item.amount, 0);
  const sicknessTotal = adjustments.sickness.reduce((sum, item) => sum + item.amount, 0);
  const extraPaymentsTotal = adjustments.extraPayments.reduce((sum, item) => sum + item.amount, 0);
  const extraDeductionsTotal = adjustments.extraDeductions.reduce((sum, item) => sum + item.amount, 0);

  // Calculate adjusted gross
  const adjustedGross = row.salary + overtimeTotal + statutoryTotal + sicknessTotal + extraPaymentsTotal;
  
  // Calculate adjusted net pay (simplified - in production would recalculate tax/NIC)
  const adjustedNetPay = adjustedGross - row.tax - row.employeeNic - row.pension - row.studentLoan - extraDeductionsTotal;

  const clickableCellClass = "cursor-pointer hover:bg-primary/10 transition-colors rounded";

  return (
    <>
      <TableRow className={cn(index % 2 === 0 ? 'bg-background' : 'bg-muted/30')}>
        <TableCell className="font-medium whitespace-nowrap">{row.payrollId || '-'}</TableCell>
        <TableCell className="whitespace-nowrap">{row.name}</TableCell>
        <TableCell className="text-right tabular-nums">{formatCurrency(row.salary)}</TableCell>
        <TableCell 
          className={cn("text-right tabular-nums", clickableCellClass)}
          onClick={() => setOpenDialog('statutory')}
        >
          {formatCurrency(statutoryTotal || row.statutoryPayment)}
        </TableCell>
        <TableCell 
          className={cn("text-right tabular-nums", clickableCellClass)}
          onClick={() => setOpenDialog('overtime')}
        >
          {formatCurrency(overtimeTotal || row.overtime)}
        </TableCell>
        <TableCell 
          className={cn("text-right tabular-nums", clickableCellClass)}
          onClick={() => setOpenDialog('sickness')}
        >
          {formatCurrency(sicknessTotal || row.ssp)}
        </TableCell>
        <TableCell 
          className={cn("text-right tabular-nums", clickableCellClass)}
          onClick={() => setOpenDialog('extraPayments')}
        >
          {formatCurrency(extraPaymentsTotal || row.extraPayments)}
        </TableCell>
        <TableCell 
          className={cn("text-right tabular-nums", clickableCellClass)}
          onClick={() => setOpenDialog('extraDeductions')}
        >
          {formatCurrency(extraDeductionsTotal || row.extraDeductions)}
        </TableCell>
        <TableCell className="text-right tabular-nums font-medium">
          {formatCurrency(adjustedGross)}
        </TableCell>
        <TableCell className="text-right tabular-nums">{formatCurrency(row.tax)}</TableCell>
        <TableCell className="text-right tabular-nums">{formatCurrency(row.employeeNic)}</TableCell>
        <TableCell className="text-right tabular-nums">
          {formatCurrency(row.pensionablePay)} / {formatCurrency(row.pension)}
        </TableCell>
        <TableCell className="text-right tabular-nums">{formatCurrency(row.studentLoan)}</TableCell>
        <TableCell className="text-right tabular-nums font-medium text-primary">
          {formatCurrency(adjustedNetPay)}
        </TableCell>
      </TableRow>

      {/* Dialogs */}
      <OvertimeDialog
        open={openDialog === 'overtime'}
        onOpenChange={(open) => setOpenDialog(open ? 'overtime' : null)}
        employeeName={row.name}
        employeeRates={employeeRates}
        initialItems={adjustments.overtime}
        onSave={(items: OvertimeItem[]) => onAdjustmentsChange({ ...adjustments, overtime: items })}
      />

      <StatutoryPaymentDialog
        open={openDialog === 'statutory'}
        onOpenChange={(open) => setOpenDialog(open ? 'statutory' : null)}
        employeeName={row.name}
        initialItems={adjustments.statutoryPayment}
        onSave={(items: StatutoryPaymentItem[]) => onAdjustmentsChange({ ...adjustments, statutoryPayment: items })}
      />

      <SicknessDialog
        open={openDialog === 'sickness'}
        onOpenChange={(open) => setOpenDialog(open ? 'sickness' : null)}
        employeeName={row.name}
        initialItems={adjustments.sickness}
        onSave={(items: SicknessItem[]) => onAdjustmentsChange({ ...adjustments, sickness: items })}
      />

      <ExtraPaymentsDialog
        open={openDialog === 'extraPayments'}
        onOpenChange={(open) => setOpenDialog(open ? 'extraPayments' : null)}
        employeeName={row.name}
        initialItems={adjustments.extraPayments}
        onSave={(items: ExtraPaymentItem[]) => onAdjustmentsChange({ ...adjustments, extraPayments: items })}
      />

      <ExtraDeductionsDialog
        open={openDialog === 'extraDeductions'}
        onOpenChange={(open) => setOpenDialog(open ? 'extraDeductions' : null)}
        employeeName={row.name}
        initialItems={adjustments.extraDeductions}
        onSave={(items: ExtraDeductionItem[]) => onAdjustmentsChange({ ...adjustments, extraDeductions: items })}
      />
    </>
  );
}
