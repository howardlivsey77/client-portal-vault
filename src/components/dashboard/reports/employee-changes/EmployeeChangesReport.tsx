
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { subMonths } from "date-fns";
import { format } from "date-fns";
import { DateRangeFilter } from "./DateRangeFilter";
import { ChangesList } from "./ChangesList";
import { useEmployeeChanges } from "./useEmployeeChanges";

export function EmployeeChangesReport() {
  // Add date range filter state
  const defaultStartDate = subMonths(new Date(), 3); // Default to 3 months ago
  const defaultEndDate = new Date(); // Default to today
  
  const [startDate, setStartDate] = useState<Date | undefined>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date | undefined>(defaultEndDate);
  
  // Get filtered changes based on date range
  const { changes: sortedChanges, loading } = useEmployeeChanges(startDate, endDate);
  
  const handleResetFilters = () => {
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading report data...</div>;
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
            Employee Changes
            {startDate && endDate && (
              <span className="text-sm font-normal text-monday-gray ml-2">
                ({format(startDate, "PP")} - {format(endDate, "PP")})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ChangesList changes={sortedChanges} />
        </CardContent>
      </Card>
    </div>
  );
}
