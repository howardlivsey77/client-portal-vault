import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { getCompanyId } from "@/utils/company/getCompanyId";

/**
 * Check for existing employees within a specific company
 */
export const findExistingEmployees = async (
  importData: EmployeeData[],
  companyId?: string
): Promise<EmployeeData[]> => {
  try {
    // Get company ID using centralized utility
    const effectiveCompanyId = getCompanyId(companyId);
    
    if (!effectiveCompanyId) {
      console.warn("No company ID provided for employee lookup - skipping existing employee check");
      return [];
    }
    
    console.log("Checking for existing employees in company:", effectiveCompanyId);
    
    // Extract emails, payroll_ids, and national insurance numbers from import data
    const emails = importData
      .filter(emp => emp.email)
      .map(emp => emp.email);
    
    const payrollIds = importData
      .filter(emp => emp.payroll_id)
      .map(emp => emp.payroll_id);
    
    const nationalInsuranceNumbers = importData
      .filter(emp => emp.national_insurance_number)
      .map(emp => emp.national_insurance_number);
    
    console.log("Checking for existing employees with emails:", emails);
    console.log("Checking for existing employees with payroll IDs:", payrollIds);
    console.log("Checking for existing employees with National Insurance Numbers:", nationalInsuranceNumbers);
    
    // Check for existing employees with matching emails - filtered by company_id
    const { data: emailMatches, error: emailError } = await supabase
      .from("employees")
      .select("*")
      .eq("company_id", effectiveCompanyId)
      .in("email", emails.length > 0 ? emails : ['no-emails-found']);
    
    if (emailError) throw emailError;
    
    // Check for existing employees with matching payroll IDs - filtered by company_id
    const { data: payrollMatches, error: payrollError } = await supabase
      .from("employees")
      .select("*")
      .eq("company_id", effectiveCompanyId)
      .in("payroll_id", payrollIds.length > 0 ? payrollIds : ['no-payroll-ids-found']);
    
    if (payrollError) throw payrollError;
    
    // Check for existing employees with matching National Insurance Numbers - filtered by company_id
    const { data: niMatches, error: niError } = await supabase
      .from("employees")
      .select("*")
      .eq("company_id", effectiveCompanyId)
      .in("national_insurance_number", nationalInsuranceNumbers.length > 0 ? nationalInsuranceNumbers : ['no-ni-numbers-found']);
    
    if (niError) throw niError;
    
    // Combine the results, removing duplicates
    const allMatches = [...(emailMatches || [])];
    
    if (payrollMatches) {
      payrollMatches.forEach(employee => {
        if (!allMatches.some(e => e.id === employee.id)) {
          allMatches.push(employee);
        }
      });
    }
    
    if (niMatches) {
      niMatches.forEach(employee => {
        if (!allMatches.some(e => e.id === employee.id)) {
          allMatches.push(employee);
        }
      });
    }
    
    console.log("Found existing employees:", allMatches);
    return allMatches || [];
  } catch (error) {
    console.error("Error checking for existing employees:", error);
    return [];
  }
};
