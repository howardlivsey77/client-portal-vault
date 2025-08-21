import { useState, useEffect } from "react";
import { Employee } from "@/types/employee-types";
import { SicknessEntitlementSummary } from "@/types/sickness";
import { useEmployees } from "@/hooks/useEmployees";
import { sicknessService } from "@/services/sicknessService";
import { useToast } from "@/hooks/use-toast";

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
            // Get entitlement usage for the employee
            const entitlementUsage = await sicknessService.getEntitlementUsage(employee.id);
            
            let entitlementSummary: SicknessEntitlementSummary | null = null;
            
            if (entitlementUsage) {
              // Calculate rolling 12 month usage
              const rolling12MonthUsage = await sicknessService.calculateRolling12MonthUsage(employee.id);
              
              // Calculate SSP usage
              const sspUsage = await sicknessService.calculateSspUsage(employee.id);
              
              // Build the entitlement summary
              entitlementSummary = {
                full_pay_remaining: Math.max(0, entitlementUsage.full_pay_entitled_days - entitlementUsage.full_pay_used_days),
                half_pay_remaining: Math.max(0, entitlementUsage.half_pay_entitled_days - entitlementUsage.half_pay_used_days),
                full_pay_used: entitlementUsage.full_pay_used_days,
                half_pay_used: entitlementUsage.half_pay_used_days,
                full_pay_used_rolling_12_months: rolling12MonthUsage.fullPayUsed,
                half_pay_used_rolling_12_months: rolling12MonthUsage.halfPayUsed,
                total_used_rolling_12_months: rolling12MonthUsage.totalUsed,
                opening_balance_full_pay: entitlementUsage.opening_balance_full_pay || 0,
                opening_balance_half_pay: entitlementUsage.opening_balance_half_pay || 0,
                current_tier: `Tier ${entitlementUsage.current_service_months || 0} months`,
                service_months: entitlementUsage.current_service_months || 0,
                rolling_period_start: sicknessService.getRolling12MonthPeriod().start,
                rolling_period_end: sicknessService.getRolling12MonthPeriod().end,
                ssp_entitled_days: sspUsage.qualifyingDaysPerWeek * 28, // 28 weeks max
                ssp_used_current_year: sspUsage.sspUsedCurrentYear,
                ssp_used_rolling_12_months: sspUsage.sspUsedRolling12,
                ssp_remaining_days: Math.max(0, (sspUsage.qualifyingDaysPerWeek * 28) - sspUsage.sspUsedRolling12)
              };
            }

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