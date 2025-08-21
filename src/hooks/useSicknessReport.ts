import { useState, useEffect } from "react";
import { Employee } from "@/types/employee-types";
import { SicknessEntitlementSummary } from "@/types/sickness";
import { useEmployees } from "@/hooks/useEmployees";
import { useToast } from "@/hooks/use-toast";
import { calculateSicknessEntitlementSummary } from "@/utils/sicknessCalculations";

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
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SicknessReportFilters>({
    department: '',
    searchTerm: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const { toast } = useToast();

  const fetchSicknessData = async () => {
    if (!employees || employees.length === 0) {
      setReportData([]);
      return;
    }

    setLoading(true);
    try {
      const sicknessData = await Promise.all(
        employees.map(async (employee) => {
          try {
            // Use the shared calculation utility for consistency
            const entitlementSummary = await calculateSicknessEntitlementSummary(employee);

            return {
              employee,
              entitlementSummary
            };
          } catch (error) {
            console.error(`Error fetching sickness data for employee ${employee.id}:`, error);
            return {
              employee,
              entitlementSummary: null
            };
          }
        })
      );

      setReportData(sicknessData);
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

  const updateFilters = (newFilters: Partial<SicknessReportFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const filteredAndSortedData = reportData
    .filter(data => {
      if (filters.department && data.employee.department !== filters.department) {
        return false;
      }
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const fullName = `${data.employee.first_name} ${data.employee.last_name}`.toLowerCase();
        return fullName.includes(searchLower);
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'name':
          comparison = `${a.employee.first_name} ${a.employee.last_name}`.localeCompare(
            `${b.employee.first_name} ${b.employee.last_name}`
          );
          break;
        case 'department':
          comparison = a.employee.department.localeCompare(b.employee.department);
          break;
        case 'serviceMonths':
          comparison = (a.entitlementSummary?.service_months || 0) - (b.entitlementSummary?.service_months || 0);
          break;
        case 'usedDays':
          comparison = (a.entitlementSummary?.full_pay_used || 0) - (b.entitlementSummary?.full_pay_used || 0);
          break;
        case 'remainingFullPay':
          comparison = (a.entitlementSummary?.full_pay_remaining || 0) - (b.entitlementSummary?.full_pay_remaining || 0);
          break;
        case 'remainingHalfPay':
          comparison = (a.entitlementSummary?.half_pay_remaining || 0) - (b.entitlementSummary?.half_pay_remaining || 0);
          break;
        case 'remainingSsp':
          comparison = (a.entitlementSummary?.ssp_remaining_days || 0) - (b.entitlementSummary?.ssp_remaining_days || 0);
          break;
        default:
          break;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

  useEffect(() => {
    if (!employeesLoading && employees.length > 0) {
      fetchSicknessData();
    }
  }, [employees, employeesLoading]);

  const departments = [...new Set(employees.map(emp => emp.department))].filter(Boolean);

  return {
    reportData: filteredAndSortedData,
    loading: loading || employeesLoading,
    filters,
    updateFilters,
    departments,
    refreshData: fetchSicknessData
  };
};