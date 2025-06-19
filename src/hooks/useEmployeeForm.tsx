
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { employeeSchema, EmployeeFormValues, genderOptions, defaultWorkPattern } from "@/types/employee";
import { fetchEmployeeById, createEmployee, updateEmployee } from "@/services/employeeService";
import { fetchWorkPatterns, saveWorkPatterns } from "@/components/employees/details/work-pattern/utils";
import { useCompany } from "@/providers/CompanyProvider";

// Helper function to safely parse date from database without timezone issues
const parseDateFromDatabase = (dateString: string | null): Date | null => {
  if (!dateString) return null;
  
  // Parse as local date to avoid timezone shifts
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const useEmployeeForm = (employeeId?: string) => {
  const isEditMode = employeeId !== undefined && employeeId !== "new";
  const [loading, setLoading] = useState(isEditMode);
  const [submitLoading, setSubmitLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [readOnly, setReadOnly] = useState(false);
  const { currentCompany } = useCompany();
  
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
      // Default values for HMRC fields
      tax_code: "",
      week_one_month_one: false,
      nic_code: "",
      student_loan_plan: null,
      // Default values for NHS pension fields
      nhs_pension_member: false,
      previous_year_pensionable_pay: null,
      nhs_pension_tier: null,
      nhs_pension_employee_rate: null,
      // Monthly salary
      monthly_salary: null,
    },
  });
  
  // Function to ensure work patterns have the correct payroll ID
  const syncWorkPatternsWithPayrollId = async (employeeId: string, payrollId: string | null) => {
    try {
      // First fetch the current work patterns
      const workPatterns = await fetchWorkPatterns(employeeId);
      
      // Check if any work patterns don't have the payroll ID
      const needsUpdate = workPatterns.some(pattern => pattern.payrollId !== payrollId);
      
      if (needsUpdate) {
        // Update all patterns with the correct payroll ID
        const updatedPatterns = workPatterns.map(pattern => ({
          ...pattern,
          payrollId: payrollId
        }));
        
        // Save the updated patterns
        await saveWorkPatterns(employeeId, updatedPatterns);
        console.log("Work patterns updated with payroll ID:", payrollId);
      }
    } catch (error) {
      console.error("Error syncing work patterns with payroll ID:", error);
    }
  };
  
  const fetchEmployeeData = async () => {
    try {
      if (!employeeId) return;
      
      setLoading(true);
      
      // Fetch employee data
      const data = await fetchEmployeeById(employeeId);
      
      // Fetch work patterns for this employee
      const workPatterns = await fetchWorkPatterns(employeeId);
      
      if (data) {
        // Convert date strings to Date objects safely without timezone issues
        const dateOfBirth = parseDateFromDatabase(data.date_of_birth);
        const hireDate = parseDateFromDatabase(data.hire_date) || new Date();
        
        // Validate gender to ensure it matches one of the allowed values
        const validGender = data.gender && 
          ["Male", "Female", "Other", "Prefer not to say"].includes(data.gender)
            ? data.gender as "Male" | "Female" | "Other" | "Prefer not to say"
            : undefined;
        
        // If employee has a payroll ID, ensure work patterns are synced with it
        if (data.payroll_id) {
          await syncWorkPatternsWithPayrollId(employeeId, data.payroll_id);
        }
        
        console.log("Fetched employee data - hire_date:", data.hire_date, "parsed as:", hireDate);
        
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
          work_pattern: JSON.stringify(workPatterns), // Use work patterns from new table
          rate_2: data.rate_2,
          rate_3: data.rate_3,
          rate_4: data.rate_4,
          // HMRC fields
          tax_code: data.tax_code || "",
          week_one_month_one: data.week_one_month_one || false,
          nic_code: data.nic_code || "",
          student_loan_plan: data.student_loan_plan,
          // NHS pension fields
          nhs_pension_member: data.nhs_pension_member || false,
          previous_year_pensionable_pay: data.previous_year_pensionable_pay,
          nhs_pension_tier: data.nhs_pension_tier,
          nhs_pension_employee_rate: data.nhs_pension_employee_rate,
          // Monthly salary
          monthly_salary: data.monthly_salary,
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
  
  useEffect(() => {
    if (isEditMode && employeeId) {
      fetchEmployeeData();
    }
  }, [isEditMode, employeeId]);
  
  const onSubmit = async (data: EmployeeFormValues) => {
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
        // Create new employee - now with all 3 required parameters
        await createEmployee(data, user.id, currentCompany.id);
        
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
