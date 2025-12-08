import { useState, useEffect } from "react";
import { Employee, SicknessEntitlementSummary } from "@/types";
import { useEmployees, useToast } from "@/hooks";
import { calculateSicknessEntitlementSummary } from "@/utils";

export interface SicknessReportData {
  employee: Employee;
  entitlementSummary: SicknessEntitlementSummary | null;
}

export interface SicknessReportFilters {
  department: string;
  searchTerm: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const useSicknessReport = () => {
  const { employees, loading: employeesLoading } = useEmployees();
  const [reportData, setReportData] = useState<SicknessReportData[]>([]);
  const [filteredData, setFilteredData] = useState<SicknessReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SicknessReportFilters>({
    searchTerm: "",
    department: "",
    sortBy: "name",
    sortOrder: "asc"
  });
  const { toast } = useToast();

  const fetchSicknessData = async () => {
    if (!employees || employees.length === 0) {
      setReportData([]);
      return;
    }

    setLoading(true);
    setReportData([]);
    try {
      const allResults: SicknessReportData[] = [];
      const total = employees.length;
      const batchSize = 20; // limit concurrency to avoid timeouts

      for (let i = 0; i < total; i += batchSize) {
        const batch = employees.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (employee) => {
            try {
              // Use the shared calculation utility for consistency
              const entitlementSummary = await calculateSicknessEntitlementSummary(employee);
              return { employee, entitlementSummary };
            } catch (error) {
              console.error(`Error fetching sickness data for employee ${employee.id}:`, error);
              return { employee, entitlementSummary: null };
            }
          })
        );

        allResults.push(...batchResults);
        // Update incrementally so UI stays responsive
        setReportData([...allResults]);
      }
    } catch (error) {
      console.error("Error fetching sickness report data:", error);
      toast({
        title: "Error loading sickness report",
        description: "Failed to load sickness data for employees",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const applyFilters = (data: SicknessReportData[]) => {
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

    // Sorting
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (filters.sortBy) {
        case "name":
          compareValue = `${a.employee.first_name} ${a.employee.last_name}`.localeCompare(
            `${b.employee.first_name} ${b.employee.last_name}`
          );
          break;
        case "usage":
          compareValue = (a.entitlementSummary?.total_used_rolling_12_months || 0) - 
                        (b.entitlementSummary?.total_used_rolling_12_months || 0);
          break;
        case "remaining":
          compareValue = (a.entitlementSummary?.full_pay_remaining || 0) - 
                        (b.entitlementSummary?.full_pay_remaining || 0);
          break;
        case "service":
          compareValue = (a.entitlementSummary?.service_months || 0) - 
                        (b.entitlementSummary?.service_months || 0);
          break;
      }

      return filters.sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  };

  useEffect(() => {
    if (!employeesLoading && employees.length > 0) {
      fetchSicknessData();
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
    loading: loading || employeesLoading,
    refreshData: fetchSicknessData,
    filters,
    setFilters,
    departments
  };
};
