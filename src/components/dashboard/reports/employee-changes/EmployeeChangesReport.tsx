
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, FileText } from "lucide-react";
import { subMonths } from "date-fns";
import { format } from "date-fns";
import { DateRangeFilter } from "./DateRangeFilter";
import { ChangesList } from "./ChangesList";
import { useEmployeeChanges } from "./useEmployeeChanges";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { formatCurrency } from "@/lib/formatters";

interface EmployeeChangesReportProps {
  standalone?: boolean;
}

export function EmployeeChangesReport({ standalone = false }: EmployeeChangesReportProps) {
  const { toast } = useToast();
  // Make sure May 5th, 2025 is within the default date range
  const defaultStartDate = subMonths(new Date(2025, 4, 5), 1); // Go back 1 month from May 5th
  const defaultEndDate = new Date(2025, 4, 10); // Few days after May 5th
  
  const [startDate, setStartDate] = useState<Date | undefined>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date | undefined>(defaultEndDate);
  
  // Get filtered changes based on date range
  const { changes: sortedChanges, loading } = useEmployeeChanges(startDate, endDate);
  
  const handleResetFilters = () => {
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    toast({
      title: "Date filter reset",
      description: "Showing employee changes with default date range",
    });
  };
  
  // Use an effect to show toast notifications about May 5th changes
  useEffect(() => {
    if (!loading && sortedChanges.length > 0) {
      const may5Changes = sortedChanges.filter(change => 
        change.date === "2025-05-05"
      );
      
      // Show a message about May 5th changes
      if (may5Changes.length === 0) {
        toast({
          title: "May 5th changes",
          description: "No employee changes were found for May 5th, 2025.",
        });
      } else {
        toast({
          title: "May 5th changes detected",
          description: `Found ${may5Changes.length} real employee changes on May 5th, 2025.`,
        });
      }
    }
  }, [loading, sortedChanges, toast]);

  // Function to export data to Excel
  const handleExportToExcel = () => {
    if (sortedChanges.length === 0) {
      toast({
        title: "Export failed",
        description: "No data available to export",
        variant: "destructive",
      });
      return;
    }

    try {
      // Format the data for Excel export with proper GBP formatting
      const excelData = sortedChanges.map(change => {
        // Format currency values for Excel export
        let oldValue = change.oldValue || '-';
        let newValue = change.newValue || '-';
        
        // Check if this is a monetary field and format it as GBP if needed
        if (change.field === 'Hourly Rate' || change.field === 'Salary' || 
            change.field?.toLowerCase().includes('rate') || 
            change.field?.toLowerCase().includes('pay')) {
          // Remove any existing currency symbol for clean formatting
          if (oldValue !== '-' && !isNaN(parseFloat(oldValue.replace(/[^0-9.-]+/g, '')))) {
            const numValue = parseFloat(oldValue.replace(/[^0-9.-]+/g, ''));
            oldValue = formatCurrency(numValue);
          }
          
          if (newValue !== '-' && !isNaN(parseFloat(newValue.replace(/[^0-9.-]+/g, '')))) {
            const numValue = parseFloat(newValue.replace(/[^0-9.-]+/g, ''));
            newValue = formatCurrency(numValue);
          }
        }
        
        return {
          Date: format(new Date(change.date), "dd/MM/yyyy"),
          Employee: change.employeeName,
          Type: change.type,
          Field: change.field || "-",
          "Old Value": oldValue,
          "New Value": newValue,
        };
      });

      // Create a worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Create a workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Changes");
      
      // Generate Excel file name with current date
      const fileName = `employee_changes_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      
      // Export to Excel
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Export successful",
        description: `Data exported to ${fileName}`,
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting data",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading report data...</div>;
  }

  return (
    <div className="space-y-6">
      {standalone && (
        <div className="flex items-center justify-between">
          <h2 className="monday-section-title flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Employee Changes Report
          </h2>
        </div>
      )}
      
      {/* Date Range Filter Controls */}
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onReset={handleResetFilters}
      />
      
      <Card className="overflow-hidden border border-monday-border bg-white shadow-sm">
        <CardHeader className="bg-monday-lightest-gray border-b border-monday-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-monday-darkblue">
              Real Employee Changes
              {startDate && endDate && (
                <span className="text-sm font-normal text-monday-gray ml-2">
                  ({format(startDate, "PP")} - {format(endDate, "PP")})
                </span>
              )}
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportToExcel}
              disabled={sortedChanges.length === 0}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sortedChanges.length > 0 ? (
            <ChangesList changes={sortedChanges} />
          ) : (
            <div className="p-6 text-center text-monday-gray">
              No real employee changes found in the selected date range
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
