import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, RefreshCw } from "lucide-react";
import { HoursRatesReportTable } from "./HoursRatesReportTable";
import { HoursRatesReportFilters } from "./HoursRatesReportFilters";
import { useHoursRatesReport } from "@/hooks/useHoursRatesReport";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

export const HoursRatesReport = () => {
  const {
    reportData,
    loading,
    refreshData,
    filters,
    setFilters,
    departments
  } = useHoursRatesReport();
  const { toast } = useToast();

  const handleExportToExcel = () => {
    try {
      const exportData = reportData.map(data => ({
        'Payroll ID': data.employee.payroll_id || 'N/A',
        'First Name': data.employee.first_name,
        'Surname': data.employee.last_name,
        'Department': data.employee.department,
        'Hourly Rate': data.employee.hourly_rate || 0,
        'Hours per Week': data.employee.hours_per_week || 0,
        'Rate 2': data.employee.rate_2 || 0,
        'Rate 3': data.employee.rate_3 || 0,
        'Monthly Pay': data.monthlyCompensation.toFixed(2)
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Hours & Rates Report');
      
      const filename = `hours-rates-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast({
        title: "Export successful",
        description: "Hours and rates report has been exported to Excel."
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Export failed",
        description: "Failed to export the hours and rates report.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Employee Hours and Rates Report</h1>
          <p className="text-muted-foreground">
            Comprehensive breakdown of employee compensation and working hours
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
      <HoursRatesReportFilters 
        filters={filters}
        onFiltersChange={setFilters}
        departments={departments}
      />

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Compensation Data</CardTitle>
          <CardDescription>
            Showing {reportData.length} employee{reportData.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HoursRatesReportTable data={reportData} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
};
