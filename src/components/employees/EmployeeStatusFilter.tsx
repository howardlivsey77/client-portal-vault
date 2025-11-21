import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmployeeStatusFilterProps {
  selectedFilter: 'current' | 'past' | 'all';
  onFilterChange: (filter: 'current' | 'past' | 'all') => void;
}

export const EmployeeStatusFilter = ({ selectedFilter, onFilterChange }: EmployeeStatusFilterProps) => {
  return (
    <Tabs value={selectedFilter} onValueChange={(value) => onFilterChange(value as 'current' | 'past' | 'all')}>
      <TabsList>
        <TabsTrigger value="current">Current</TabsTrigger>
        <TabsTrigger value="past">Past</TabsTrigger>
        <TabsTrigger value="all">All</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
