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


  useEffect(() => {
    if (!employeesLoading && employees.length > 0) {
      fetchSicknessData();
    }
  }, [employees, employeesLoading]);

  return {
    reportData,
    loading: loading || employeesLoading,
    refreshData: fetchSicknessData
  };
};