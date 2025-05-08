
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmployees } from '@/hooks/useEmployees';
import { useTimesheetContext } from './TimesheetContext';

export const EmployeeSelector = () => {
  const { employees, loading } = useEmployees();
  const { currentEmployeeId, setCurrentEmployeeId } = useTimesheetContext();
  const [sorted, setSorted] = useState(employees);

  useEffect(() => {
    // Sort employees alphabetically by last name, then first name
    const sortedEmployees = [...employees].sort((a, b) => {
      if (a.last_name !== b.last_name) {
        return a.last_name.localeCompare(b.last_name);
      }
      return a.first_name.localeCompare(b.first_name);
    });
    
    setSorted(sortedEmployees);
  }, [employees]);

  return (
    <div className="flex items-center gap-2 mb-6">
      <span className="text-sm font-medium">Select Employee:</span>
      
      <Select
        value={currentEmployeeId || ""}
        onValueChange={(value) => setCurrentEmployeeId(value)}
        disabled={loading}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select an employee" />
        </SelectTrigger>
        <SelectContent>
          {sorted.map((employee) => (
            <SelectItem key={employee.id} value={employee.id}>
              {employee.last_name}, {employee.first_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
