import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, RefreshCw } from "lucide-react";
import { SicknessReportTable } from "./SicknessReportTable";
import { SicknessReportFilters } from "./SicknessReportFilters";
import { useSicknessReport } from "@/hooks/useSicknessReport";
import { useToast } from "@/hooks";
import * as XLSX from 'xlsx';

export const SicknessReport = () => {
  const {
    reportData,
    loading,
    refreshData,
    filters,
    setFilters,
    departments
  } = useSicknessReport();
  const { toast } = useToast();

  const handleExportToExcel = () => {
    try {
      const exportData = reportData.map(data => ({
        'Payroll ID': data.employee.payroll_id || 'N/A',
        'First Name': data.employee.first_name,
        'Surname': data.employee.last_name,
        'Service Months': data.entitlementSummary?.service_months || 0,
        'Total Used (Rolling 12 Months)': data.entitlementSummary?.total_used_rolling_12_months || 0,
        'Full Used (Rolling 12 Months)': data.entitlementSummary?.full_pay_used_rolling_12_months || 0,
        'Half Used (Rolling 12 Months)': data.entitlementSummary?.half_pay_used_rolling_12_months || 0,
        'SSP Used (Rolling 12 Months)': data.entitlementSummary?.ssp_used_rolling_12_months || 0,
        'Full Pay Remaining': data.entitlementSummary?.full_pay_remaining || 0,
        'Half Pay Remaining': data.entitlementSummary?.half_pay_remaining || 0,
        'SSP Remaining': data.entitlementSummary?.ssp_remaining_days || 0
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sickness Report');
      
      const filename = `sickness-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast({
        title: "Export successful",
        description: "Sickness report has been exported to Excel."
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Export failed",
        description: "Failed to export the sickness report.",
        variant: "destructive"
      });
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sickness Report</h1>
          <p className="text-muted-foreground">
            Overview of employee sickness entitlements and usage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleExportToExcel}
            disabled={loading || reportData.length === 0}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <SicknessReportFilters 
        filters={filters}
        onFiltersChange={setFilters}
        departments={departments}
      />

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Sickness Data</CardTitle>
          <CardDescription>
            Showing {reportData.length} employee{reportData.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SicknessReportTable data={reportData} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
};