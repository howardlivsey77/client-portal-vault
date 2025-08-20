import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Search, Filter } from "lucide-react";
import { SicknessReportFilters as Filters } from "@/hooks/useSicknessReport";

interface SicknessReportFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Partial<Filters>) => void;
  departments: string[];
}

export const SicknessReportFilters = ({ 
  filters, 
  onFiltersChange, 
  departments 
}: SicknessReportFiltersProps) => {
  const handleSortChange = (sortBy: string) => {
    if (filters.sortBy === sortBy) {
      onFiltersChange({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      onFiltersChange({ sortBy, sortOrder: 'asc' });
    }
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Filters & Search</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Department Filter */}
        <Select 
          value={filters.department} 
          onValueChange={(value) => onFiltersChange({ department: value === "all" ? "" : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select 
          value={filters.sortBy} 
          onValueChange={(value) => onFiltersChange({ sortBy: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="department">Department</SelectItem>
            <SelectItem value="serviceMonths">Service Months</SelectItem>
            <SelectItem value="usedDays">Sickness Used</SelectItem>
            <SelectItem value="remainingFullPay">Full Pay Remaining</SelectItem>
            <SelectItem value="remainingHalfPay">Half Pay Remaining</SelectItem>
            <SelectItem value="remainingSsp">SSP Remaining</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Order */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSortChange(filters.sortBy)}
          className="flex items-center gap-2"
        >
          <ArrowUpDown className="h-3 w-3" />
          Sort {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        </Button>
      </div>
    </div>
  );
};