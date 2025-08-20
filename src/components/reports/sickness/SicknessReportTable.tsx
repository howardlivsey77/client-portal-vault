import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download } from "lucide-react";
import { SicknessReportData } from "@/hooks/useSicknessReport";
import { generateSicknessReportPDF } from "@/utils/pdfExport";
import { sicknessService } from "@/services/sicknessService";
import { useToast } from "@/hooks/use-toast";

interface SicknessReportTableProps {
  data: SicknessReportData[];
  loading: boolean;
}

export const SicknessReportTable = ({ data, loading }: SicknessReportTableProps) => {
  const { toast } = useToast();

  const handleExportIndividualReport = async (reportData: SicknessReportData) => {
    try {
      // Fetch detailed sickness records for the employee
      const sicknessRecords = await sicknessService.getSicknessRecords(reportData.employee.id);
      
      const filename = `sickness-report-${reportData.employee.first_name}-${reportData.employee.last_name}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      generateSicknessReportPDF(
        reportData.employee,
        sicknessRecords,
        reportData.entitlementSummary,
        null, // No company logo for now
        filename
      );
      
      toast({
        title: "Report exported",
        description: `Sickness report for ${reportData.employee.first_name} ${reportData.employee.last_name} has been downloaded.`
      });
    } catch (error) {
      console.error("Error exporting individual report:", error);
      toast({
        title: "Export failed",
        description: "Failed to export the sickness report.",
        variant: "destructive"
      });
    }
  };

  const formatDays = (days: number | undefined | null) => {
    if (days === undefined || days === null) return "N/A";
    return days.toFixed(1);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (remaining: number | undefined | null, type: string) => {
    if (remaining === undefined || remaining === null) return null;
    
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    let text = "";
    
    if (type === "ssp") {
      if (remaining <= 5) variant = "destructive";
      else if (remaining <= 15) variant = "secondary";
      text = `${formatDays(remaining)} days`;
    } else {
      if (remaining <= 2) variant = "destructive";
      else if (remaining <= 7) variant = "secondary";
      text = `${formatDays(remaining)} days`;
    }
    
    return <Badge variant={variant}>{text}</Badge>;
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
              <TableHead>Department</TableHead>
              <TableHead>Hire Date</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Used (Rolling 12m)</TableHead>
              <TableHead>Full Pay Left</TableHead>
              <TableHead>Half Pay Left</TableHead>
              <TableHead>SSP Left</TableHead>
              <TableHead>Actions</TableHead>
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
            <TableHead>Department</TableHead>
            <TableHead>Hire Date</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Used (Rolling 12m)</TableHead>
            <TableHead>Full Pay Left</TableHead>
            <TableHead>Half Pay Left</TableHead>
            <TableHead>SSP Left</TableHead>
            <TableHead>Actions</TableHead>
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
              <TableCell>{reportData.employee.department}</TableCell>
              <TableCell>
                {formatDate(reportData.employee.hire_date)}
              </TableCell>
              <TableCell>
                {reportData.entitlementSummary?.service_months || 0} months
              </TableCell>
              <TableCell>
                {formatDays(reportData.entitlementSummary?.full_pay_used_rolling_12_months)} days
              </TableCell>
              <TableCell>
                {formatDays(reportData.entitlementSummary?.full_pay_remaining)} days
              </TableCell>
              <TableCell>
                {formatDays(reportData.entitlementSummary?.half_pay_remaining)} days
              </TableCell>
              <TableCell>
                {formatDays(reportData.entitlementSummary?.ssp_remaining_days)} days
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportIndividualReport(reportData)}
                  className="flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Export
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};