import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HoursRatesReportData } from "@/hooks/useHoursRatesReport";
import { Skeleton } from "@/components/ui/skeleton";
import { FileX } from "lucide-react";

interface HoursRatesReportTableProps {
  data: HoursRatesReportData[];
  loading: boolean;
}

export const HoursRatesReportTable = ({ data, loading }: HoursRatesReportTableProps) => {
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "£0.00";
    return `£${value.toFixed(2)}`;
  };

  const formatHours = (hours: number | null | undefined) => {
    if (hours === null || hours === undefined) return "0";
    return hours.toFixed(1);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileX className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No employees found</p>
        <p className="text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payroll ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Department</TableHead>
            <TableHead className="text-right">Hourly Rate</TableHead>
            <TableHead className="text-right">Hours/Week</TableHead>
            <TableHead className="text-right">Rate 2</TableHead>
            <TableHead className="text-right">Rate 3</TableHead>
            <TableHead className="text-right">Monthly Pay</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.employee.id}>
              <TableCell className="font-medium">
                {item.employee.payroll_id || "N/A"}
              </TableCell>
              <TableCell>
                {item.employee.first_name} {item.employee.last_name}
              </TableCell>
              <TableCell>{item.employee.department}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.employee.hourly_rate)}
              </TableCell>
              <TableCell className="text-right">
                {formatHours(item.employee.hours_per_week)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.employee.rate_2)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(item.employee.rate_3)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(item.monthlyCompensation)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
