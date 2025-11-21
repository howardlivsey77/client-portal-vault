import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { HoursRatesReportFilters as FilterType } from "@/hooks/useHoursRatesReport";

interface HoursRatesReportFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  departments: string[];
}

export function HoursRatesReportFilters({ filters, onFiltersChange, departments }: HoursRatesReportFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchTerm: value });
  };

  const handleDepartmentChange = (value: string) => {
    onFiltersChange({ ...filters, department: value === "all" ? "" : value });
  };

  const handleSortChange = (value: string) => {
    onFiltersChange({ ...filters, sortBy: value });
  };

  const handleSortOrderToggle = () => {
    onFiltersChange({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      searchTerm: "",
      department: "",
      sortBy: "name",
      sortOrder: "asc",
      minRate: undefined,
      maxRate: undefined
    });
  };

  const hasActiveFilters = filters.searchTerm || filters.department || filters.minRate || filters.maxRate;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or payroll ID..."
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Department Filter */}
        <Select 
          value={filters.department || "all"} 
          onValueChange={handleDepartmentChange}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Departments" />
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

        {/* Sort By */}
        <Select value={filters.sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="rate">Hourly Rate</SelectItem>
            <SelectItem value="hours">Hours/Week</SelectItem>
            <SelectItem value="annual">Annual Pay</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Order Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleSortOrderToggle}
          title={`Sort ${filters.sortOrder === 'asc' ? 'ascending' : 'descending'}`}
        >
          {filters.sortOrder === 'asc' ? '↑' : '↓'}
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearFilters}
            title="Clear filters"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex gap-2 text-sm text-muted-foreground flex-wrap">
          <span>Active filters:</span>
          {filters.searchTerm && (
            <span className="bg-muted px-2 py-1 rounded">
              Search: {filters.searchTerm}
            </span>
          )}
          {filters.department && (
            <span className="bg-muted px-2 py-1 rounded">
              Department: {filters.department}
            </span>
          )}
          {filters.minRate !== undefined && (
            <span className="bg-muted px-2 py-1 rounded">
              Min Rate: £{filters.minRate}
            </span>
          )}
          {filters.maxRate !== undefined && (
            <span className="bg-muted px-2 py-1 rounded">
              Max Rate: £{filters.maxRate}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
