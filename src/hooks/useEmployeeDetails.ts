import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import { 
  Employee, 
  EmployeeDetailsHookReturn 
} from "@/types/employeeDetails";
import { 
  fetchEmployeeWithNavigation, 
  updateEmployeeFieldById, 
  deleteEmployeeById 
} from "@/services/employeeDetailsService";

// Properly re-export the type using 'export type'
export type { Employee } from "@/types/employeeDetails";

export const useEmployeeDetails = (employeeId: string | undefined): EmployeeDetailsHookReturn => {
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
      
      const { employee, nextEmployeeId, prevEmployeeId } = await fetchEmployeeWithNavigation(employeeId);
      
      setEmployee(employee);
      setNextEmployeeId(nextEmployeeId);
      setPrevEmployeeId(prevEmployeeId);
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
      
      if (!employeeId) return;
      await deleteEmployeeById(employeeId);
      
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
      
      await updateEmployeeFieldById(employeeId, fieldName, value);
      
      toast({
        title: "Update successful",
        description: "Employee information has been updated.",
      });
      
      // Refresh data
      await fetchEmployeeData();
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
