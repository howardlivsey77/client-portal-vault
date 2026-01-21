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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Payroll ID</TableHead>
            <TableHead>Rate Type</TableHead>
            <TableHead className="text-right">Units</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead className="text-right">Value</TableHead>
            <TableHead>Import Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.employee_name}</TableCell>
              <TableCell>{record.payroll_id || '-'}</TableCell>
              <TableCell>{formatRateType(record.rate_type)}</TableCell>
              <TableCell className="text-right">{record.imported_units?.toFixed(2) || '-'}</TableCell>
              <TableCell className="text-right">{formatCurrency(record.imported_rate)}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(record.imported_value)}</TableCell>
              <TableCell>{new Date(record.imported_at).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
