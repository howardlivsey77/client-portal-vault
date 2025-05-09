
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
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10; // Number of records per page

  const fetchPayrollHistory = async (currentFilters: PayrollHistoryFilters, page: number) => {
    try {
      setLoading(true);
      
      // Start building the query for count
      let countQuery = supabase
        .from('payroll_results')
        .select('id', { count: 'exact', head: true });
      
      // Apply date filters to count query if they exist
      if (currentFilters.dateFrom) {
        countQuery = countQuery.gte('payroll_period', currentFilters.dateFrom.toISOString().split('T')[0]);
      }
      
      if (currentFilters.dateTo) {
        countQuery = countQuery.lte('payroll_period', currentFilters.dateTo.toISOString().split('T')[0]);
      }
      
      // Get the count
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error("Error fetching count:", countError);
      } else {
        setTotalCount(count || 0);
      }
      
      // Start building the main query
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
      
      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Execute the query with pagination
      const { data, error } = await query
        .order('payroll_period', { ascending: false })
        .range(from, to);
          
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
    fetchPayrollHistory(filters, currentPage);
  }, [toast, filters, currentPage]);

  // Handler for filter changes
  const handleFilterChange = (newFilters: PayrollHistoryFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handler for page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return { 
    loading, 
    payrollHistory, 
    handleFilterChange,
    totalCount,
    currentPage,
    pageSize,
    handlePageChange
  };
}
