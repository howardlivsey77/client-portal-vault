
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { subMonths } from "date-fns";
import { format } from "date-fns";
import { DateRangeFilter } from "./DateRangeFilter";
import { ChangesList } from "./ChangesList";
import { useEmployeeChanges } from "./useEmployeeChanges";
import { useToast } from "@/hooks/use-toast";

export function EmployeeChangesReport() {
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

  if (loading) {
    return <div className="flex justify-center p-8">Loading report data...</div>;
  }

  const may5Changes = sortedChanges.filter(change => 
    change.date === "2025-05-05"
  );
  
  // Show a message if no changes found for May 5th
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="monday-section-title flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Employee Changes Report
        </h2>
      </div>
      
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
          <CardTitle className="text-lg font-medium text-monday-darkblue">
            Real Employee Changes
            {startDate && endDate && (
              <span className="text-sm font-normal text-monday-gray ml-2">
                ({format(startDate, "PP")} - {format(endDate, "PP")})
              </span>
            )}
          </CardTitle>
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
