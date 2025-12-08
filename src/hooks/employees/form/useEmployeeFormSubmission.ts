
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/common/use-toast";
import { useCompany } from "@/providers/CompanyProvider";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeFormValues } from "@/types/employee";
import { createEmployee, updateEmployee } from "@/services";

export const useEmployeeFormSubmission = (
  isEditMode: boolean,
  employeeId: string | undefined,
  setSubmitLoading: (loading: boolean) => void
) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentCompany } = useCompany();

  const onSubmit = useCallback(async (data: EmployeeFormValues) => {
    setSubmitLoading(true);
    
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      if (!currentCompany?.id) {
        throw new Error("No company selected. Please select a company first.");
      }
      
      console.log("Submitting employee data - hire_date:", data.hire_date);
      
      if (isEditMode && employeeId) {
        // Update existing employee
        await updateEmployee(employeeId, data);
        
        toast({
          title: "Employee updated",
          description: "Employee information has been updated successfully.",
        });
      } else {
        // Create new employee
        await createEmployee(data, user.id, currentCompany.id);
        
        toast({
          title: "Employee created",
          description: "A new employee has been added successfully.",
        });
      }
      
      // Redirect to employees list
      navigate("/employees");
    } catch (error: any) {
      console.error("Error submitting employee:", error);
      toast({
        title: isEditMode ? "Error updating employee" : "Error creating employee",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitLoading(false);
    }
  }, [isEditMode, employeeId, currentCompany?.id, toast, navigate, setSubmitLoading]);

  return { onSubmit };
};
