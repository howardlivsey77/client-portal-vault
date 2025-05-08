
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { employeeSchema, EmployeeFormValues, genderOptions, defaultWorkPattern } from "@/types/employee";
import { fetchEmployeeById, createEmployee, updateEmployee } from "@/services/employeeService";

export const useEmployeeForm = (employeeId?: string) => {
  const isEditMode = employeeId !== undefined && employeeId !== "new";
  const [loading, setLoading] = useState(isEditMode);
  const [submitLoading, setSubmitLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [readOnly, setReadOnly] = useState(false);
  
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      department: "",
      hours_per_week: 40,
      hourly_rate: 0,
      date_of_birth: null,
      hire_date: new Date(),
      email: "",
      address1: "",
      address2: "",
      address3: "",
      address4: "",
      postcode: "",
      work_pattern: JSON.stringify(defaultWorkPattern),
    },
  });
  
  const fetchEmployeeData = async () => {
    try {
      if (!employeeId) return;
      const data = await fetchEmployeeById(employeeId);
      
      if (data) {
        // Convert date_of_birth string to Date object if it exists
        const dateOfBirth = data.date_of_birth ? new Date(data.date_of_birth) : null;
        const hireDate = data.hire_date ? new Date(data.hire_date) : new Date();
        
        // Validate gender to ensure it matches one of the allowed values
        const validGender = data.gender && 
          ["Male", "Female", "Other", "Prefer not to say"].includes(data.gender)
            ? data.gender as "Male" | "Female" | "Other" | "Prefer not to say"
            : undefined;
        
        form.reset({
          first_name: data.first_name,
          last_name: data.last_name,
          department: data.department,
          hours_per_week: data.hours_per_week || 40,
          hourly_rate: data.hourly_rate || 0,
          date_of_birth: dateOfBirth,
          hire_date: hireDate,
          email: data.email || "",
          address1: data.address1 || "",
          address2: data.address2 || "",
          address3: data.address3 || "",
          address4: data.address4 || "",
          postcode: data.postcode || "",
          payroll_id: data.payroll_id || "",
          gender: validGender,
          work_pattern: data.work_pattern || JSON.stringify(defaultWorkPattern),
        });
      }
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
  
  const onSubmit = async (data: EmployeeFormValues) => {
    setSubmitLoading(true);
    
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      if (isEditMode && employeeId) {
        // Update existing employee
        await updateEmployee(employeeId, data);
        
        toast({
          title: "Employee updated",
          description: "Employee information has been updated successfully.",
        });
      } else {
        // Create new employee
        await createEmployee(data, user.id);
        
        toast({
          title: "Employee created",
          description: "A new employee has been added successfully.",
        });
      }
      
      // Redirect to employees list
      navigate("/employees");
    } catch (error: any) {
      toast({
        title: isEditMode ? "Error updating employee" : "Error creating employee",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  return {
    form,
    loading,
    isEditMode,
    readOnly,
    submitLoading,
    setReadOnly,
    fetchEmployeeData,
    onSubmit
  };
};
