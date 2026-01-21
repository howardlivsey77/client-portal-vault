import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PayrollSummaryFilters, getPeriodMonthName } from "@/hooks/reports/usePayrollSummaryReport";

interface PayrollSummaryReportFiltersProps {
  filters: PayrollSummaryFilters;
  onFiltersChange: (filters: PayrollSummaryFilters) => void;
  departments: string[];
}

// Generate available financial years (current and previous 2 years)
function generateFinancialYears(): string[] {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  // Financial year starts in April (month 3)
  const currentFY = currentMonth >= 3 ? currentYear : currentYear - 1;
  
  const years: string[] = [];
  for (let i = 2; i >= -1; i--) {
    const startYear = currentFY - i;
    const endYear = (startYear + 1) % 100;
    years.push(`${startYear % 100}/${endYear.toString().padStart(2, '0')}`);
  }
  
  return years;
}

// Generate periods 1-12 with month names
function generatePeriods(): { value: number; label: string }[] {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Period ${i + 1} - ${getPeriodMonthName(i + 1)}`,
  }));
}

export function PayrollSummaryReportFilters({
  filters,
  onFiltersChange,
  departments,
}: PayrollSummaryReportFiltersProps) {
  const financialYears = generateFinancialYears();
  const periods = generatePeriods();

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-foreground">
          Financial Year
        </label>
        <Select
          value={filters.financialYear}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, financialYear: value })
          }
        >
          <SelectTrigger className="w-[140px] bg-background border-border">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {financialYears.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-foreground">
          Tax Period
        </label>
        <Select
          value={filters.periodNumber.toString()}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, periodNumber: parseInt(value, 10) })
          }
        >
          <SelectTrigger className="w-[200px] bg-background border-border">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {periods.map((period) => (
              <SelectItem key={period.value} value={period.value.toString()}>
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {departments.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-muted-foreground">
            Department
          </label>
          <Select
            value={filters.department || "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                department: value === "all" ? undefined : value,
              })
            }
          >
            <SelectTrigger className="w-[180px] bg-background border-border">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
