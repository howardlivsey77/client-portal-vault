import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImportedVsPaidFilters } from "@/hooks/reports/useImportedVsPaidReport";

interface ImportedVsPaidReportFiltersProps {
  filters: ImportedVsPaidFilters;
  onFiltersChange: (filters: ImportedVsPaidFilters) => void;
  availablePeriods: { periodNumber: number; financialYear: number }[];
}

const PERIOD_NAMES = ['April', 'May', 'June', 'July', 'August', 'September', 
                      'October', 'November', 'December', 'January', 'February', 'March'];

export function ImportedVsPaidReportFilters({ 
  filters, 
  onFiltersChange, 
  availablePeriods 
}: ImportedVsPaidReportFiltersProps) {
  // Get unique years from available periods
  const years = [...new Set(availablePeriods.map(p => p.financialYear))].sort((a, b) => b - a);
  
  // Get periods available for selected year
  const periodsForYear = availablePeriods
    .filter(p => p.financialYear === filters.financialYear)
    .map(p => p.periodNumber)
    .sort((a, b) => a - b);

  // Generate all 12 periods for selection
  const allPeriods = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Financial Year */}
          <div className="space-y-2">
            <Label>Financial Year</Label>
            <Select
              value={filters.financialYear.toString()}
              onValueChange={(value) => 
                onFiltersChange({ ...filters, financialYear: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.length > 0 ? (
                  years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}/{(year + 1) % 100}
                    </SelectItem>
                  ))
                ) : (
                  // Show current and previous year if no data
                  <>
                    <SelectItem value={(new Date().getFullYear()).toString()}>
                      {new Date().getFullYear()}/{(new Date().getFullYear() + 1) % 100}
                    </SelectItem>
                    <SelectItem value={(new Date().getFullYear() - 1).toString()}>
                      {new Date().getFullYear() - 1}/{new Date().getFullYear() % 100}
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Period */}
          <div className="space-y-2">
            <Label>Period</Label>
            <Select
              value={filters.periodNumber.toString()}
              onValueChange={(value) => 
                onFiltersChange({ ...filters, periodNumber: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {allPeriods.map(period => (
                  <SelectItem 
                    key={period} 
                    value={period.toString()}
                  >
                    {period} - {PERIOD_NAMES[period - 1]}
                    {periodsForYear.includes(period) ? '' : ' (no data)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Import Type */}
          <div className="space-y-2">
            <Label>Import Type</Label>
            <Select
              value={filters.importType}
              onValueChange={(value) => 
                onFiltersChange({ ...filters, importType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="extra_hours">Extra Hours</SelectItem>
                <SelectItem value="sickness">Sickness</SelectItem>
                <SelectItem value="absence">Absence</SelectItem>
                <SelectItem value="expenses">Expenses</SelectItem>
                <SelectItem value="adjustments">Adjustments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
