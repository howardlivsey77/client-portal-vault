import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  hire_date: string;
  hours_per_week: number | null;
  hourly_rate: number | null;
  rate_2: number | null;
  rate_3: number | null;
  rate_4: number | null;
  email: string | null;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  address4: string | null;
  postcode: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  date_of_birth: string | null;
  payroll_id: string | null;
  gender: string | null;
}

export const useEmployeeDetails = (employeeId: string | undefined) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchEmployeeData = async () => {
    try {
      if (!employeeId) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", employeeId)
        .single();
        
      if (error) throw error;
      
      setEmployee(data as Employee);
    } catch (error: any) {
      toast({
        title: "Error fetching employee data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const deleteEmployee = async () => {
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
        .eq("id", employeeId);
      
      if (error) throw error;
      
      toast({
        title: "Employee deleted",
        description: "The employee record has been successfully deleted.",
      });
      
      // Navigate back to employees list
      navigate("/employees");
    } catch (error: any) {
      toast({
        title: "Error deleting employee",
        description: error.message,
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeData();
    }
  }, [employeeId]);

  // Format address for display
  const formattedAddress = employee ? 
    [employee.address1, employee.address2, employee.address3, employee.address4, employee.postcode]
      .filter(Boolean)
      .join(", ") : '';

  return {
    employee,
    loading,
    isAdmin,
    formattedAddress,
    deleteEmployee,
    fetchEmployeeData
  };
};
