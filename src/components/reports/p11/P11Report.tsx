import { useState, useEffect, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileDown, Loader2 } from "lucide-react";
import { useEmployees } from "@/hooks/employees/useEmployees";
import { useP11Report } from "@/hooks/reports/useP11Report";
import { P11ReportHeader } from "./P11ReportHeader";
import { P11ReportTable } from "./P11ReportTable";
import { P11ReportTotals } from "./P11ReportTotals";
import { generateP11Pdf } from "./p11PdfGenerator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/providers/CompanyProvider";

// Generate tax year options (current year and previous 2 years)
function getTaxYearOptions(): string[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  
  // Tax year runs April to April
  // If before April, current tax year started previous calendar year
  const currentTaxYearStart = currentMonth < 3 ? currentYear - 1 : currentYear;
  
  return [
    `${currentTaxYearStart}/${(currentTaxYearStart + 1).toString().slice(-2)}`,
    `${currentTaxYearStart - 1}/${currentTaxYearStart.toString().slice(-2)}`,
    `${currentTaxYearStart - 2}/${(currentTaxYearStart - 1).toString().slice(-2)}`,
  ];
}

// Fetch distinct tax years from payroll_results for an employee
async function fetchAvailableTaxYears(employeeId: string, companyId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("payroll_results")
    .select("tax_year")
    .eq("employee_id", employeeId)
    .eq("company_id", companyId);
  
  if (error || !data) return [];
  
  // Get unique tax years
  const uniqueYears = [...new Set(data.map(r => r.tax_year).filter(Boolean))] as string[];
  return uniqueYears;
}

export function P11Report() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedTaxYear, setSelectedTaxYear] = useState<string>("");
  const [dbTaxYears, setDbTaxYears] = useState<string[]>([]);
  const { employees, loading: employeesLoading } = useEmployees();
  const { reportData, loading: reportLoading, error, fetchReport } = useP11Report();
  const { currentCompany } = useCompany();

  const generatedTaxYearOptions = getTaxYearOptions();
  
  // Merge generated options with database tax years
  const taxYearOptions = useMemo(() => {
    const merged = [...new Set([...generatedTaxYearOptions, ...dbTaxYears])];
    // Sort descending (most recent first)
    return merged.sort((a, b) => {
      const yearA = parseInt(a.split('/')[0]);
      const yearB = parseInt(b.split('/')[0]);
      return yearB - yearA;
    });
  }, [generatedTaxYearOptions, dbTaxYears]);

  // Fetch available tax years when employee changes
  useEffect(() => {
    if (selectedEmployeeId && currentCompany?.id) {
      fetchAvailableTaxYears(selectedEmployeeId, currentCompany.id)
        .then(setDbTaxYears);
    } else {
      setDbTaxYears([]);
    }
  }, [selectedEmployeeId, currentCompany?.id]);

  // Set default tax year on mount or when options change
  useEffect(() => {
    if (!selectedTaxYear && taxYearOptions.length > 0) {
      setSelectedTaxYear(taxYearOptions[0]);
    }
  }, [taxYearOptions, selectedTaxYear]);

  // Fetch report when employee or tax year changes
  useEffect(() => {
    if (selectedEmployeeId && selectedTaxYear) {
      fetchReport(selectedEmployeeId, selectedTaxYear);
    }
  }, [selectedEmployeeId, selectedTaxYear]);

  const handleExportPdf = async () => {
    if (!reportData) return;
    
    try {
      await generateP11Pdf(reportData);
      toast.success("P11 exported to PDF");
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error("Failed to generate PDF");
    }
  };

  const activeEmployees = employees.filter((e) => e.status === "active" || e.status === null);

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-1.5 block">Employee</label>
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger>
              <SelectValue placeholder="Select employee..." />
            </SelectTrigger>
            <SelectContent>
              {employeesLoading ? (
                <SelectItem value="loading" disabled>Loading...</SelectItem>
              ) : (
                activeEmployees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name}
                    {employee.payroll_id && ` (${employee.payroll_id})`}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-48">
          <label className="text-sm font-medium mb-1.5 block">Tax Year</label>
          <Select value={selectedTaxYear} onValueChange={setSelectedTaxYear}>
            <SelectTrigger>
              <SelectValue placeholder="Select year..." />
            </SelectTrigger>
            <SelectContent>
              {taxYearOptions.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {reportData && (
          <div className="flex items-end">
            <Button onClick={handleExportPdf} variant="outline" className="gap-2">
              <FileDown className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {reportLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!selectedEmployeeId && !reportLoading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Select an employee to view their P11 Deductions Working Sheet</p>
          </CardContent>
        </Card>
      )}

      {/* Report display */}
      {reportData && !reportLoading && (
        <div className="space-y-6">
          <P11ReportHeader 
            employee={reportData.employee} 
            company={reportData.company} 
            taxYear={reportData.taxYear} 
          />
          <P11ReportTable periods={reportData.periods} />
          <P11ReportTotals ytdTotals={reportData.ytdTotals} />
        </div>
      )}
    </div>
  );
}
