import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, RefreshCw } from "lucide-react";
import { ImportedVsPaidReportTable } from "./ImportedVsPaidReportTable";
import { ImportedVsPaidReportFilters } from "./ImportedVsPaidReportFilters";
import { useImportedVsPaidReport } from "@/hooks/reports/useImportedVsPaidReport";
import { useToast } from "@/hooks";
import * as XLSX from 'xlsx';

export const ImportedVsPaidReport = () => {
  const {
    reportData,
    loading,
    refreshData,
    filters,
    setFilters,
    availablePeriods,
    totals
  } = useImportedVsPaidReport();
  const { toast } = useToast();

  const getPeriodName = (periodNumber: number) => {
    const months = ['April', 'May', 'June', 'July', 'August', 'September', 
                    'October', 'November', 'December', 'January', 'February', 'March'];
    return months[periodNumber - 1] || `Period ${periodNumber}`;
  };

  const handleExportToExcel = () => {
    try {
      const exportData = reportData.map(data => ({
        'Employee': data.employee_name,
        'Payroll ID': data.payroll_id || 'N/A',
        'Type': data.import_type,
        'Rate Type': data.rate_type || 'Standard',
        'Imported Units': data.imported_units || 0,
        'Imported Rate': data.imported_rate || 0,
        'Imported Value': data.imported_value || 0,
        'Import Date': new Date(data.imported_at).toLocaleDateString(),
        'Source File': data.source_file_name || 'N/A'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Import Audit');
      
      const filename = `imported-data-period${filters.periodNumber}-${filters.financialYear}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast({
        title: "Export successful",
        description: "Import audit report has been exported to Excel."
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Export failed",
        description: "Failed to export the import audit report.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Imported vs Paid Report</h1>
          <p className="text-muted-foreground">
            Track imported payroll data for reconciliation
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
      <ImportedVsPaidReportFilters 
        filters={filters}
        onFiltersChange={setFilters}
        availablePeriods={availablePeriods}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Period</CardDescription>
            <CardTitle className="text-xl">
              {getPeriodName(filters.periodNumber)} {filters.financialYear}/{(filters.financialYear + 1) % 100}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Imported Units</CardDescription>
            <CardTitle className="text-xl">{totals.importedUnits.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Imported Value</CardDescription>
            <CardTitle className="text-xl">£{totals.importedValue.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Import Audit Records</CardTitle>
          <CardDescription>
            Showing {reportData.length} record{reportData.length !== 1 ? 's' : ''} for {getPeriodName(filters.periodNumber)} {filters.financialYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImportedVsPaidReportTable data={reportData} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
};
