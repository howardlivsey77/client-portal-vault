
import { useState, useMemo } from "react";
import { useEmployees } from "@/hooks/useEmployees";
import { EmployeeChange } from "./types";
import { isAfter, isBefore, parseISO, startOfDay, endOfDay } from "date-fns";

export function useEmployeeChanges(startDate?: Date, endDate?: Date) {
  const { employees, loading } = useEmployees();
  
  // Generate employee changes data
  const generateEmployeeChanges = (): EmployeeChange[] => {
    const changes: EmployeeChange[] = [];
    
    // Add hire changes
    employees.forEach(employee => {
      changes.push({
        id: `${employee.id}-hire`,
        employeeName: `${employee.first_name} ${employee.last_name}`,
        date: employee.hire_date,
        type: 'hire',
        details: `Hired into ${employee.department} department`,
        field: 'Status',
        oldValue: 'Not Employed',
        newValue: 'Active Employee'
      });
      
      // Simulate some department changes (for demonstration purposes)
      if (Math.random() > 0.7) {
        const departments = ['HR', 'Engineering', 'Marketing', 'Sales', 'Finance'];
        const oldDept = employee.department;
        const newDept = departments[Math.floor(Math.random() * departments.length)];
        
        // Only add if the departments are different
        if (oldDept !== newDept) {
          // Generate a random date between hire date and now
          const hireDate = new Date(employee.hire_date);
          const now = new Date();
          const changeDateTimestamp = hireDate.getTime() + Math.random() * (now.getTime() - hireDate.getTime());
          const changeDate = new Date(changeDateTimestamp);
          
          changes.push({
            id: `${employee.id}-dept-${changeDate.getTime()}`,
            employeeName: `${employee.first_name} ${employee.last_name}`,
            date: changeDate.toISOString().split('T')[0],
            type: 'modification',
            details: 'Department changed',
            field: 'Department',
            oldValue: oldDept,
            newValue: newDept
          });
        }
      }
      
      // Simulate some address changes
      if (Math.random() > 0.6 && employee.address1) {
        const oldAddress = employee.address1;
        const newAddress = oldAddress + " (Updated)";
        
        const hireDate = new Date(employee.hire_date);
        const now = new Date();
        const changeDateTimestamp = hireDate.getTime() + Math.random() * (now.getTime() - hireDate.getTime());
        const changeDate = new Date(changeDateTimestamp);
        
        changes.push({
          id: `${employee.id}-address-${changeDate.getTime()}`,
          employeeName: `${employee.first_name} ${employee.last_name}`,
          date: changeDate.toISOString().split('T')[0],
          type: 'modification',
          details: 'Address updated',
          field: 'Address',
          oldValue: oldAddress,
          newValue: newAddress
        });
      }
    });
    
    return changes;
  };
  
  const employeeChanges = useMemo(() => generateEmployeeChanges(), [employees]);
  
  // Filter and sort changes by date
  const filteredChanges = useMemo(() => {
    let filtered = [...employeeChanges];
    
    // Apply date filters
    if (startDate || endDate) {
      filtered = filtered.filter(change => {
        const changeDate = parseISO(change.date);
        
        if (startDate && endDate) {
          // Check if date is within range (inclusive)
          return !isBefore(changeDate, startOfDay(startDate)) && 
                 !isAfter(changeDate, endOfDay(endDate));
        }
        
        if (startDate && !endDate) {
          // Only check start date
          return !isBefore(changeDate, startOfDay(startDate));
        }
        
        if (!startDate && endDate) {
          // Only check end date
          return !isAfter(changeDate, endOfDay(endDate));
        }
        
        // No date filters applied
        return true;
      });
    }
    
    // Sort changes by date descending (most recent first)
    return filtered.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [employeeChanges, startDate, endDate]);
  
  return {
    changes: filteredChanges,
    loading
  };
}
