
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import { useCompany } from "@/providers/CompanyProvider";
import { Employee } from "@/types/employee-types";

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const { currentCompany } = useCompany();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      console.log("Fetching employees for company:", currentCompany?.id);
      
      if (!currentCompany?.id) {
        console.log("No current company selected, setting empty employee list");
        setEmployees([]);
        return;
      }

      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("company_id", currentCompany.id)
        .order("last_name", { ascending: true });
        
      if (error) {
        console.error("Error fetching employees:", error);
        throw error;
      }
      
      console.log("Employees data retrieved:", data?.length || 0, "records for company", currentCompany.name);
      
      // Cast the data to ensure TypeScript recognizes work_pattern
      const typedData = data as unknown as Employee[];
      setEmployees(typedData || []);
    } catch (error: any) {
      console.error("Error in fetchEmployees:", error);
      toast({
        title: "Error fetching employees",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const deleteEmployee = async (id: string) => {
    // Only admin users can delete employees
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only administrators can delete employee records.",
        variant: "destructive"
      });
      return;
    }
    
    if (!confirm("Are you sure you want to delete this employee record?")) {
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      toast({
        title: "Employee deleted",
        description: "The employee record has been successfully deleted.",
      });
      
      // Update the employees list
      setEmployees(employees.filter(emp => emp.id !== id));
    } catch (error: any) {
      toast({
        title: "Error deleting employee",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees when currentCompany changes
  useEffect(() => {
    fetchEmployees();
  }, [currentCompany?.id]);

  return {
    employees,
    loading,
    fetchEmployees,
    deleteEmployee
  };
};

export type { Employee };
