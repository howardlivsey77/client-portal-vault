import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText } from "lucide-react";
import { SicknessReportData } from "@/hooks/useSicknessReport";

interface SicknessReportTableProps {
  data: SicknessReportData[];
  loading: boolean;
}

export const SicknessReportTable = ({ data, loading }: SicknessReportTableProps) => {

  const formatDays = (days: number | undefined | null) => {
    if (days === undefined || days === null) return "N/A";
    return days.toFixed(1);
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payroll ID</TableHead>
              <TableHead>First Name</TableHead>
              <TableHead>Surname</TableHead>
              <TableHead>Service (months)</TableHead>
              <TableHead>Total Used (12m)</TableHead>
              <TableHead>Full Used (12m)</TableHead>
              <TableHead>Half Used (12m)</TableHead>
              <TableHead>SSP Used (12m)</TableHead>
            <TableHead>Full Pay Left</TableHead>
            <TableHead>Half Pay Left</TableHead>
            <TableHead>SSP Left</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                {[...Array(11)].map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-4 bg-muted animate-pulse rounded" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No employees found</h3>
        <p className="text-muted-foreground">No employees match your current filters.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payroll ID</TableHead>
            <TableHead>First Name</TableHead>
            <TableHead>Surname</TableHead>
            <TableHead>Service (months)</TableHead>
            <TableHead>Total Used (12m)</TableHead>
            <TableHead>Full Used (12m)</TableHead>
            <TableHead>Half Used (12m)</TableHead>
            <TableHead>SSP Used (12m)</TableHead>
              <TableHead>Full Pay Left</TableHead>
              <TableHead>Half Pay Left</TableHead>
              <TableHead>SSP Left</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((reportData) => (
            <TableRow key={reportData.employee.id}>
              <TableCell>
                {reportData.employee.payroll_id || 'N/A'}
              </TableCell>
              <TableCell className="font-medium">
                {reportData.employee.first_name}
              </TableCell>
              <TableCell className="font-medium">
                {reportData.employee.last_name}
              </TableCell>
              <TableCell>
                {reportData.entitlementSummary?.service_months || 0}
              </TableCell>
              <TableCell>
                {formatDays(reportData.entitlementSummary?.total_used_rolling_12_months)}
              </TableCell>
              <TableCell>
                {formatDays(reportData.entitlementSummary?.full_pay_used_rolling_12_months)}
              </TableCell>
              <TableCell>
                {formatDays(reportData.entitlementSummary?.half_pay_used_rolling_12_months)}
              </TableCell>
              <TableCell>
                {formatDays(reportData.entitlementSummary?.ssp_used_rolling_12_months)}
              </TableCell>
              <TableCell>
                {formatDays(reportData.entitlementSummary?.full_pay_remaining)}
              </TableCell>
              <TableCell>
                {formatDays(reportData.entitlementSummary?.half_pay_remaining)}
              </TableCell>
              <TableCell>
                {formatDays(reportData.entitlementSummary?.ssp_remaining_days)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};