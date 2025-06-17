import { PaymentHoursRatesReport as PaymentHoursRatesReportComponent } from "./payment-hours-rates/PaymentHoursRatesReport";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { getProcessedPayrollData } from "@/components/payroll/hooks";
import { ExtraHoursSummary, EmployeeHoursData } from "@/components/payroll/types";
import { 
  fetchPayrollPeriods, 
  fetchPayrollEmployeeDetails 
} from "@/services/payroll";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export function PaymentHoursRatesReport() {
  const location = useLocation();
  const isDirectAccess = location.pathname === "/payment-hours-rates-report";
  const [reportData, setReportData] = useState<ExtraHoursSummary | null>(null);
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeHoursData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // First check if we have data in memory from a recent upload
      const inMemoryData = getProcessedPayrollData();
      if (inMemoryData) {
        setReportData(inMemoryData);
        setEmployeeDetails(inMemoryData.employeeDetails || []);
        setIsLoading(false);
        return;
      }
      
      // Otherwise, fetch the most recent period from the database
      if (user) {
        try {
          const periods = await fetchPayrollPeriods(user.id);
          if (periods && periods.length > 0) {
            // Get the most recent period
            const latestPeriod = periods[0];
            
            // Fetch employee details for this period
            const details = await fetchPayrollEmployeeDetails(latestPeriod.id);
            
            // Convert to our application's data structure
            const formattedDetails: EmployeeHoursData[] = details.map(detail => ({
              employeeId: detail.employee_id || '',
              employeeName: detail.employee_name || 'Unknown',
              payrollId: detail.payroll_id || '',
              rateType: detail.rate_type || 'Standard',
              rateValue: detail.rate_value || 0,
              extraHours: detail.extra_hours || 0,
              entries: detail.entries || 1
            }));
            
            setEmployeeDetails(formattedDetails);
            
            // Create a summary object
            const summary: ExtraHoursSummary = {
              totalEntries: latestPeriod.total_entries,
              totalExtraHours: latestPeriod.total_extra_hours,
              dateRange: {
                from: new Date(latestPeriod.date_from).toLocaleDateString(),
                to: new Date(latestPeriod.date_to).toLocaleDateString()
              },
              employeeCount: latestPeriod.employee_count,
              employeeDetails: formattedDetails
            };
            
            setReportData(summary);
          }
        } catch (error) {
          console.error('Error fetching payroll data:', error);
        }
      }
      
      setIsLoading(false);
    };
    
    loadData();
  }, [user]);
  
  return (
    <PaymentHoursRatesReportComponent 
      standalone={isDirectAccess} 
      data={employeeDetails} 
      isLoading={isLoading} 
    />
  );
}
