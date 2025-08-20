import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Download, RefreshCw, Users, AlertTriangle } from "lucide-react";
import { SicknessReportTable } from "./SicknessReportTable";
import { SicknessReportFilters } from "./SicknessReportFilters";
import { useSicknessReport } from "@/hooks/useSicknessReport";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

export const SicknessReport = () => {
  const {
    reportData,
    loading,
    filters,
    updateFilters,
    departments,
    refreshData
  } = useSicknessReport();
  const { toast } = useToast();

  const handleExportToExcel = () => {
    try {
      const exportData = reportData.map(data => ({
        'Payroll ID': data.employee.payroll_id || 'N/A',
        'First Name': data.employee.first_name,
        'Surname': data.employee.last_name,
        'Department': data.employee.department,
        'Hire Date': data.employee.hire_date,
        'Service Months': data.entitlementSummary?.service_months || 0,
        'Sickness Used (Rolling 12 Months)': data.entitlementSummary?.full_pay_used_rolling_12_months || 0,
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

  // Calculate summary statistics
  const totalEmployees = reportData.length;
  const employeesWithHighUsage = reportData.filter(data => 
    (data.entitlementSummary?.full_pay_remaining || 0) <= 5
  ).length;
  const averageUsage = totalEmployees > 0 
    ? reportData.reduce((sum, data) => sum + (data.entitlementSummary?.full_pay_used || 0), 0) / totalEmployees
    : 0;

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Usage Alert</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{employeesWithHighUsage}</div>
            <p className="text-xs text-muted-foreground">≤5 days remaining</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Usage</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageUsage.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">days per employee</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <SicknessReportFilters
        filters={filters}
        onFiltersChange={updateFilters}
        departments={departments}
      />

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Sickness Data</CardTitle>
          <CardDescription>
            Showing {reportData.length} employee{reportData.length !== 1 ? 's' : ''}
            {filters.department && ` in ${filters.department}`}
            {filters.searchTerm && ` matching "${filters.searchTerm}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SicknessReportTable data={reportData} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
};