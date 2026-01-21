import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/common/use-toast";
import * as XLSX from "xlsx";
import { usePayrollSummaryReport, getPeriodMonthName } from "@/hooks/reports/usePayrollSummaryReport";
import { PayrollSummaryReportFilters } from "./PayrollSummaryReportFilters";
import { PayrollSummaryReportTable } from "./PayrollSummaryReportTable";
import { formatCurrency } from "@/lib/formatters";

export function PayrollSummaryReport() {
  const { toast } = useToast();
  const {
    reportData,
    totals,
    departments,
    loading,
    filters,
    setFilters,
    refreshData,
  } = usePayrollSummaryReport();

  const handleExportToExcel = () => {
    if (reportData.length === 0) {
      toast({
        title: "No data to export",
        description: "There is no payroll data for the selected period.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Map data to export format
      const exportData = reportData.map((record) => ({
        "Employee ID": record.employeeId,
        "First Name": record.firstName,
        "Surname": record.lastName,
        "Department": record.department || "",
        "Cost Centre": record.costCentre || "",
        "Gross Pay": record.grossPay,
        "OT Hours": record.overtimeHours,
        "OT Value": record.overtimeValue,
        "Tax": record.tax,
        "Employee NIC": record.employeeNic,
        "Student Loan": record.studentLoan,
        "Net Pay": record.netPay,
        "Employer NIC": record.employerNic,
        "Expenses": record.expenseReimbursements,
        "Employee Pension": record.employeePension,
        "Employer Pension": record.employerPension,
      }));

      // Add totals row
      exportData.push({
        "Employee ID": "TOTALS",
        "First Name": "",
        "Surname": "",
        "Department": "",
        "Cost Centre": "",
        "Gross Pay": totals.grossPay,
        "OT Hours": totals.overtimeHours,
        "OT Value": totals.overtimeValue,
        "Tax": totals.tax,
        "Employee NIC": totals.employeeNic,
        "Student Loan": totals.studentLoan,
        "Net Pay": totals.netPay,
        "Employer NIC": totals.employerNic,
        "Expenses": totals.expenseReimbursements,
        "Employee Pension": totals.employeePension,
        "Employer Pension": totals.employerPension,
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll Summary");

      // Set column widths
      worksheet["!cols"] = [
        { wch: 12 }, // Employee ID
        { wch: 15 }, // First Name
        { wch: 15 }, // Surname
        { wch: 15 }, // Department
        { wch: 12 }, // Cost Centre
        { wch: 12 }, // Gross Pay
        { wch: 10 }, // OT Hours
        { wch: 12 }, // OT Value
        { wch: 10 }, // Tax
        { wch: 12 }, // Employee NIC
        { wch: 12 }, // Student Loan
        { wch: 12 }, // Net Pay
        { wch: 12 }, // Employer NIC
        { wch: 12 }, // Expenses
        { wch: 14 }, // Employee Pension
        { wch: 14 }, // Employer Pension
      ];

      const filename = `payroll-summary-period${filters.periodNumber}-${filters.financialYear.replace("/", "-")}.xlsx`;
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Export successful",
        description: `Payroll summary exported to ${filename}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting the data.",
        variant: "destructive",
      });
    }
  };

  const periodLabel = `${getPeriodMonthName(filters.periodNumber)} (Period ${filters.periodNumber})`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Payroll Summary Report</h3>
          <p className="text-sm text-muted-foreground">
            Comprehensive payroll breakdown for all employees in a period
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshData()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportToExcel}
            disabled={loading || reportData.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <PayrollSummaryReportFilters
        filters={filters}
        onFiltersChange={setFilters}
        departments={departments}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Period</CardDescription>
            <CardTitle className="text-lg">{periodLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tax Year {filters.financialYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Gross Pay</CardDescription>
            <CardTitle className="text-lg text-primary">
              {formatCurrency(totals.grossPay)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {reportData.length} employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Net Pay</CardDescription>
            <CardTitle className="text-lg text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totals.netPay)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              After deductions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cost to Employer</CardDescription>
            <CardTitle className="text-lg text-amber-600 dark:text-amber-400">
              {formatCurrency(totals.costToEmployer)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gross + Er NIC + Er Pension
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Employee Payroll Details</CardTitle>
          </div>
          <CardDescription>
            {reportData.length} record{reportData.length !== 1 ? "s" : ""} for {periodLabel}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PayrollSummaryReportTable
            data={reportData}
            totals={totals}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
