
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PayrollHistoryItem } from "./types";
import { PayrollHistoryFilters } from "./PayrollHistoryFilter";

export function usePayrollHistory() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [payrollHistory, setPayrollHistory] = useState<PayrollHistoryItem[]>([]);
  const [filters, setFilters] = useState<PayrollHistoryFilters>({});

  const fetchPayrollHistory = async (currentFilters: PayrollHistoryFilters) => {
    try {
      setLoading(true);
      
      // Start building the query
      let query = supabase
        .from('payroll_results')
        .select(`
          *,
          employees:employee_id (
            first_name,
            last_name
          )
        `);
      
      // Apply date filters if they exist
      if (currentFilters.dateFrom) {
        query = query.gte('payroll_period', currentFilters.dateFrom.toISOString().split('T')[0]);
      }
      
      if (currentFilters.dateTo) {
        query = query.lte('payroll_period', currentFilters.dateTo.toISOString().split('T')[0]);
      }
      
      // Execute the query
      const { data, error } = await query
        .order('payroll_period', { ascending: false })
        .limit(100);
          
      if (error) {
        console.error("Error fetching payroll history:", error);
        toast({
          title: "Error",
          description: "Failed to fetch payroll history",
          variant: "destructive"
        });
        return;
      }
      
      // Process the data to include employee names and prepare for filtering
      let processedData = data.map((item: any) => ({
        ...item,
        employee_name: item.employees ? 
          `${item.employees.first_name} ${item.employees.last_name}` : 
          'Unknown Employee'
      }));
      
      // Apply employee name filter in memory if it exists
      if (currentFilters.employeeName) {
        const searchTerm = currentFilters.employeeName.toLowerCase();
        processedData = processedData.filter(item => 
          item.employee_name.toLowerCase().includes(searchTerm)
        );
      }
      
      setPayrollHistory(processedData);
    } catch (error) {
      console.error("Error in fetchPayrollHistory:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchPayrollHistory(filters);
  }, [toast, filters]);

  // Handler for filter changes
  const handleFilterChange = (newFilters: PayrollHistoryFilters) => {
    setFilters(newFilters);
  };

  return { loading, payrollHistory, handleFilterChange };
}
