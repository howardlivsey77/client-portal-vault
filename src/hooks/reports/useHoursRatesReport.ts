import { useState, useEffect } from "react";
import { Employee } from "@/types";
import { useEmployees } from "@/hooks";

export interface HoursRatesReportData {
  employee: Employee;
  weeklyCompensation: number;
  monthlyCompensation: number;
  annualCompensation: number;
}

export interface HoursRatesReportFilters {
  department: string;
  searchTerm: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  minRate?: number;
  maxRate?: number;
}

export const useHoursRatesReport = () => {
  const { employees, loading: employeesLoading } = useEmployees();
  const [reportData, setReportData] = useState<HoursRatesReportData[]>([]);
  const [filteredData, setFilteredData] = useState<HoursRatesReportData[]>([]);
  const [filters, setFilters] = useState<HoursRatesReportFilters>({
    searchTerm: "",
    department: "",
    sortBy: "name",
    sortOrder: "asc"
  });

  const calculateCompensation = (employee: Employee): HoursRatesReportData => {
    const hourlyRate = employee.hourly_rate || 0;
    const hoursPerWeek = employee.hours_per_week || 0;
    
    const weeklyCompensation = hourlyRate * hoursPerWeek;
    const monthlyCompensation = weeklyCompensation * 4.33; // Average weeks per month
    const annualCompensation = weeklyCompensation * 52;

    return {
      employee,
      weeklyCompensation,
      monthlyCompensation,
      annualCompensation
    };
  };

  const processReportData = () => {
    if (!employees || employees.length === 0) {
      setReportData([]);
      return;
    }

    const data = employees.map(calculateCompensation);
    setReportData(data);
  };

  const applyFilters = (data: HoursRatesReportData[]) => {
    let filtered = [...data];

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.employee.first_name.toLowerCase().includes(searchLower) ||
        item.employee.last_name.toLowerCase().includes(searchLower) ||
        item.employee.payroll_id?.toLowerCase().includes(searchLower)
      );
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter(item => 
        item.employee.department === filters.department
      );
    }

    // Rate range filters
    if (filters.minRate !== undefined) {
      filtered = filtered.filter(item => 
        (item.employee.hourly_rate || 0) >= filters.minRate!
      );
    }

    if (filters.maxRate !== undefined) {
      filtered = filtered.filter(item => 
        (item.employee.hourly_rate || 0) <= filters.maxRate!
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (filters.sortBy) {
        case "name":
          compareValue = `${a.employee.first_name} ${a.employee.last_name}`.localeCompare(
            `${b.employee.first_name} ${b.employee.last_name}`
          );
          break;
        case "rate":
          compareValue = (a.employee.hourly_rate || 0) - (b.employee.hourly_rate || 0);
          break;
        case "hours":
          compareValue = (a.employee.hours_per_week || 0) - (b.employee.hours_per_week || 0);
          break;
        case "annual":
          compareValue = a.annualCompensation - b.annualCompensation;
          break;
      }

      return filters.sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  };

  useEffect(() => {
    if (!employeesLoading) {
      processReportData();
    }
  }, [employees, employeesLoading]);

  useEffect(() => {
    setFilteredData(applyFilters(reportData));
  }, [reportData, filters]);

  // Get unique departments from employees
  const departments = Array.from(new Set(
    employees.map(emp => emp.department).filter(Boolean)
  )).sort();

  return {
    reportData: filteredData,
    loading: employeesLoading,
    refreshData: processReportData,
    filters,
    setFilters,
    departments
  };
};
