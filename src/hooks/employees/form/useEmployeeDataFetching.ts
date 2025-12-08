
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { fetchEmployeeById } from "@/services";
import { fetchWorkPatterns, saveWorkPatterns } from "@/components/employees/details/work-pattern/utils";

// Helper function to safely parse date from database without timezone issues
const parseDateFromDatabase = (dateString: string | null): Date | null => {
  if (!dateString) return null;
  
  // Parse as local date to avoid timezone shifts
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const useEmployeeDataFetching = (
  employeeId: string | undefined,
  isEditMode: boolean,
  form: any,
  setLoading: (loading: boolean) => void
) => {
  const { toast } = useToast();
  
  // Function to ensure work patterns have the correct payroll ID
  const syncWorkPatternsWithPayrollId = useCallback(async (employeeId: string, payrollId: string | null) => {
    try {
      const workPatterns = await fetchWorkPatterns(employeeId);
      
      const needsUpdate = workPatterns.some(pattern => pattern.payrollId !== payrollId);
      
      if (needsUpdate) {
        const updatedPatterns = workPatterns.map(pattern => ({
          ...pattern,
          payrollId: payrollId
        }));
        
        await saveWorkPatterns(employeeId, updatedPatterns);
        console.log("Work patterns updated with payroll ID:", payrollId);
      }
    } catch (error) {
      console.error("Error syncing work patterns with payroll ID:", error);
    }
  }, []);

  const fetchEmployeeData = useCallback(async () => {
    if (!employeeId || !isEditMode) return;
    
    console.log("Starting fetchEmployeeData for ID:", employeeId);
    
    try {
      setLoading(true);
      
      // Fetch employee data and work patterns in parallel for better performance
      const [employeeData, workPatterns] = await Promise.all([
        fetchEmployeeById(employeeId),
        fetchWorkPatterns(employeeId)
      ]);
      
      if (!employeeData) {
        throw new Error("Employee not found");
      }

      // Process the data before setting form values
      const dateOfBirth = parseDateFromDatabase(employeeData.date_of_birth);
      const hireDate = parseDateFromDatabase(employeeData.hire_date) || new Date();
      const leaveDate = parseDateFromDatabase((employeeData as any).leave_date);
      
      // Validate gender to ensure it matches one of the allowed values
      const validGender = employeeData.gender && 
        ["Male", "Female", "Other", "Prefer not to say"].includes(employeeData.gender)
          ? employeeData.gender as "Male" | "Female" | "Other" | "Prefer not to say"
          : undefined;
      
      console.log("Fetched employee data - hire_date:", employeeData.hire_date, "parsed as:", hireDate);
      
      // Set form values once with all data
      form.reset({
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        department: employeeData.department,
        hours_per_week: employeeData.hours_per_week || 40,
        hourly_rate: employeeData.hourly_rate || 0,
        date_of_birth: dateOfBirth,
        hire_date: hireDate,
        email: employeeData.email || "",
        address1: employeeData.address1 || "",
        address2: employeeData.address2 || "",
        address3: employeeData.address3 || "",
        address4: employeeData.address4 || "",
        postcode: employeeData.postcode || "",
        payroll_id: employeeData.payroll_id || "",
        gender: validGender,
        work_pattern: JSON.stringify(workPatterns),
        rate_2: employeeData.rate_2,
        rate_3: employeeData.rate_3,
        rate_4: employeeData.rate_4,
        tax_code: employeeData.tax_code || "",
        week_one_month_one: employeeData.week_one_month_one || false,
        nic_code: employeeData.nic_code || "",
        student_loan_plan: employeeData.student_loan_plan,
        nhs_pension_member: employeeData.nhs_pension_member || false,
        previous_year_pensionable_pay: employeeData.previous_year_pensionable_pay,
        nhs_pension_tier: employeeData.nhs_pension_tier,
        nhs_pension_employee_rate: employeeData.nhs_pension_employee_rate,
        monthly_salary: (employeeData as any).monthly_salary || null,
        status: (employeeData as any).status || "active",
        leave_date: leaveDate,
      });

      // Sync work patterns after form is populated (not during)
      if (employeeData.payroll_id) {
        // Don't await this to avoid blocking the UI
        syncWorkPatternsWithPayrollId(employeeId, employeeData.payroll_id);
      }
      
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
  }, [employeeId, isEditMode, form, toast, syncWorkPatternsWithPayrollId, setLoading]);

  return { fetchEmployeeData };
};
