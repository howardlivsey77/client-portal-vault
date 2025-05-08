
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
  work_pattern: string | null;
}

export const useEmployeeDetails = (employeeId: string | undefined) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextEmployeeId, setNextEmployeeId] = useState<string | null>(null);
  const [prevEmployeeId, setPrevEmployeeId] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchEmployeeData = async () => {
    try {
      if (!employeeId) return;
      
      setLoading(true);
      console.log("Fetching employee data for ID:", employeeId);
      
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", employeeId)
        .single();
        
      if (error) throw error;
      
      console.log("Employee data retrieved:", data);
      setEmployee(data as Employee);
      
      // Fetch next and previous employee IDs
      await fetchAdjacentEmployees(data.last_name, data.first_name, data.id);
    } catch (error: any) {
      console.error("Error in fetchEmployeeData:", error);
      toast({
        title: "Error fetching employee data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAdjacentEmployees = async (lastName: string, firstName: string, currentId: string) => {
    try {
      // Fetch next employee (alphabetically by last name, then first name)
      const { data: nextData, error: nextError } = await supabase
        .from("employees")
        .select("id")
        .or(`last_name.gt.${lastName},and(last_name.eq.${lastName},first_name.gt.${firstName})`)
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true })
        .limit(1);
      
      if (!nextError && nextData && nextData.length > 0) {
        setNextEmployeeId(nextData[0].id);
      } else {
        setNextEmployeeId(null);
      }
      
      // Fetch previous employee
      const { data: prevData, error: prevError } = await supabase
        .from("employees")
        .select("id")
        .or(`last_name.lt.${lastName},and(last_name.eq.${lastName},first_name.lt.${firstName})`)
        .order('last_name', { ascending: false })
        .order('first_name', { ascending: false })
        .limit(1);
      
      if (!prevError && prevData && prevData.length > 0) {
        setPrevEmployeeId(prevData[0].id);
      } else {
        setPrevEmployeeId(null);
      }
    } catch (error) {
      console.error("Error fetching adjacent employees:", error);
    }
  };
  
  const navigateToEmployee = (id: string | null) => {
    if (id) {
      navigate(`/employee/${id}`);
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

  // Update specific field
  const updateEmployeeField = async (fieldName: string, value: any) => {
    if (!isAdmin || !employeeId) {
      toast({
        title: "Permission denied",
        description: "Only administrators can edit employee records.",
        variant: "destructive"
      });
      return false;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from("employees")
        .update({ [fieldName]: value })
        .eq("id", employeeId);
      
      if (error) throw error;
      
      toast({
        title: "Update successful",
        description: "Employee information has been updated.",
      });
      
      // Refresh data
      fetchEmployeeData();
      return true;
    } catch (error: any) {
      toast({
        title: "Error updating employee",
        description: error.message,
        variant: "destructive"
      });
      setLoading(false);
      return false;
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
    nextEmployeeId,
    prevEmployeeId,
    navigateToEmployee,
    deleteEmployee,
    fetchEmployeeData,
    updateEmployeeField
  };
};
