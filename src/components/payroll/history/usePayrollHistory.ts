
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PayrollHistoryItem } from "./types";

export function usePayrollHistory() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [payrollHistory, setPayrollHistory] = useState<PayrollHistoryItem[]>([]);

  useEffect(() => {
    async function fetchPayrollHistory() {
      try {
        setLoading(true);
        
        // Fetch payroll results with employee details
        const { data, error } = await supabase
          .from('payroll_results')
          .select(`
            *,
            employees:employee_id (
              first_name,
              last_name
            )
          `)
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
        
        // Process the data to include employee names
        const processedData = data.map((item: any) => ({
          ...item,
          employee_name: item.employees ? 
            `${item.employees.first_name} ${item.employees.last_name}` : 
            'Unknown Employee'
        }));
        
        setPayrollHistory(processedData);
      } catch (error) {
        console.error("Error in fetchPayrollHistory:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPayrollHistory();
  }, [toast]);

  return { loading, payrollHistory };
}
