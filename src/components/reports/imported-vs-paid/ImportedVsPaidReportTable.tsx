import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ImportAuditRecord } from "@/hooks/reports/useImportedVsPaidReport";
import { cn } from "@/lib/utils";

interface ImportedVsPaidReportTableProps {
  data: ImportAuditRecord[];
  loading: boolean;
}

export function ImportedVsPaidReportTable({ data, loading }: ImportedVsPaidReportTableProps) {
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
      <div className="text-center py-8 text-muted-foreground">
        <p>No import records found for the selected period.</p>
        <p className="text-sm mt-2">Import data using the Payroll Input Wizard to see records here.</p>
      </div>
    );
  }

  const formatRateType = (rateType: string | null) => {
    if (!rateType) return 'Standard';
    return rateType;
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return `£${value.toFixed(2)}`;
  };

  const formatUnits = (value: number | null) => {
    if (value === null) return '-';
    return value.toFixed(2);
  };

  const getVarianceClass = (variance: number | null) => {
    if (variance === null) return '';
    if (Math.abs(variance) < 0.01) return 'text-green-600 dark:text-green-400';
    return 'text-destructive font-medium';
  };

  const formatVariance = (value: number | null, isCurrency: boolean = false) => {
    if (value === null) return '-';
    const absValue = Math.abs(value);
    const sign = value > 0.001 ? '+' : value < -0.001 ? '-' : '';
    if (isCurrency) {
      return `${sign}£${absValue.toFixed(2)}`;
    }
    return `${sign}${absValue.toFixed(2)}`;
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead rowSpan={2} className="align-bottom">Employee</TableHead>
            <TableHead rowSpan={2} className="align-bottom">Payroll ID</TableHead>
            <TableHead rowSpan={2} className="align-bottom">Rate Type</TableHead>
            <TableHead colSpan={3} className="text-center border-l bg-muted/50">Imported</TableHead>
            <TableHead colSpan={3} className="text-center border-l bg-muted/50">Processed</TableHead>
            <TableHead colSpan={2} className="text-center border-l bg-muted/50">Variance</TableHead>
          </TableRow>
          <TableRow>
            <TableHead className="text-right border-l">Units</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="text-right border-l">Units</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead className="text-right border-l">Units</TableHead>
            <TableHead className="text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.employee_name}</TableCell>
              <TableCell>{record.payroll_id || '-'}</TableCell>
              <TableCell>{formatRateType(record.rate_type)}</TableCell>
              {/* Imported columns */}
              <TableCell className="text-right border-l">{formatUnits(record.imported_units)}</TableCell>
              <TableCell className="text-right">{formatCurrency(record.imported_rate)}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(record.imported_value)}</TableCell>
              {/* Processed columns */}
              <TableCell className="text-right border-l">{formatUnits(record.processed_units)}</TableCell>
              <TableCell className="text-right">{formatCurrency(record.processed_rate)}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(record.processed_value)}</TableCell>
              {/* Variance columns */}
              <TableCell className={cn("text-right border-l", getVarianceClass(record.units_variance))}>
                {formatVariance(record.units_variance)}
              </TableCell>
              <TableCell className={cn("text-right", getVarianceClass(record.value_variance))}>
                {formatVariance(record.value_variance, true)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
