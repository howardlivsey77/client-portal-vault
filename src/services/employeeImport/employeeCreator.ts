
import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { roundToTwoDecimals } from "@/lib/formatters";
import { checkDuplicatePayrollIds, checkDuplicatesInImportData } from "./duplicateChecker";
import { extractValidPayrollIds, normalizePayrollId } from "./payrollIdUtils";
import { prepareWorkPatterns, prepareWorkPatternsForInsert } from "./workPatternUtils";

/**
 * Get the current user's selected company ID
 */
const getCurrentCompanyId = async (): Promise<string | null> => {
  try {
    // Try to get the last selected company from localStorage first
    const lastCompanyId = localStorage.getItem('lastSelectedCompany');
    if (lastCompanyId) {
      console.log('Using company ID from localStorage:', lastCompanyId);
      return lastCompanyId;
    }
    
    // If no stored company, get the user's first available company
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return null;
    }
    
    const { data: companies, error } = await supabase.rpc('get_user_companies', {
      _user_id: user.id,
    });
    
    if (error) {
      console.error('Error fetching user companies:', error);
      return null;
    }
    
    if (companies && companies.length > 0) {
      const companyId = companies[0].id;
      console.log('Using first available company ID:', companyId);
      return companyId;
    }
    
    console.warn('No companies found for user');
    return null;
  } catch (error) {
    console.error('Error getting current company ID:', error);
    return null;
  }
};

/**
 * Process new employees and insert them into the database
 */
export const createNewEmployees = async (
  newEmployees: EmployeeData[], 
  userId: string
): Promise<void> => {
  console.log('Creating new employees. Count:', newEmployees.length);
  console.log('New employees data:', newEmployees);
  
  // Get the current company ID
  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    throw new Error('Unable to determine company ID. Please ensure you have selected a company and try again.');
  }
  console.log('Assigning employees to company ID:', companyId);
  
  // Extract all payroll IDs that are not empty, converting to strings first
  const payrollIds = extractValidPayrollIds(newEmployees);
  console.log('Extracted payroll IDs for validation:', payrollIds);
  
  // First check for duplicates within the import data itself
  const internalDuplicates = checkDuplicatesInImportData(payrollIds);
  if (internalDuplicates.length > 0) {
    console.error('Internal duplicates found:', internalDuplicates);
    throw new Error(`Duplicate payroll IDs found in import data: ${internalDuplicates.join(', ')}. Each employee must have a unique payroll ID.`);
  }
  
  // Check for duplicates in the database
  const existingPayrollIds = await checkDuplicatePayrollIds(payrollIds);
  
  // If we have duplicate payroll IDs, throw an error
  if (existingPayrollIds.length > 0) {
    console.error('Database duplicates found:', existingPayrollIds);
    throw new Error(`duplicate key value violates unique constraint "unique_payroll_id" for IDs: ${existingPayrollIds.join(', ')}`);
  }
  
  console.log('No duplicates found, proceeding with employee creation');
  
  for (const emp of newEmployees) {
    console.log("Creating new employee with data:", emp);
    
    const normalizedPayrollId = normalizePayrollId(emp.payroll_id);
    console.log(`Employee payroll_id: "${emp.payroll_id}" -> normalized: "${normalizedPayrollId}"`);
    
    // Insert the employee with all rate fields and company_id
    const newEmployeeData = {
      first_name: emp.first_name,
      last_name: emp.last_name,
      department: emp.department,
      hours_per_week: emp.hours_per_week || 40,
      hourly_rate: roundToTwoDecimals(emp.hourly_rate) || 0,
      email: emp.email || null,
      address1: emp.address1 || null,
      address2: emp.address2 || null,
      address3: emp.address3 || null,
      address4: emp.address4 || null,
      postcode: emp.postcode || null,
      date_of_birth: emp.date_of_birth || null,
      // Only include hire_date if it exists, otherwise let database use default CURRENT_DATE
      ...(emp.hire_date && { hire_date: emp.hire_date }),
      payroll_id: normalizedPayrollId,
      user_id: userId,
      company_id: companyId, // Automatically assign the current company ID
      // Include rate fields directly in the employee record
      rate_2: roundToTwoDecimals(emp.rate_2),
      rate_3: roundToTwoDecimals(emp.rate_3),
      rate_4: roundToTwoDecimals(emp.rate_4)
    };
    
    console.log('Prepared employee data for insert (with company_id):', newEmployeeData);
    
    const { data: employeeData, error: insertError } = await supabase
      .from("employees")
      .insert(newEmployeeData)
      .select();
    
    if (insertError) {
      console.error('Error inserting employee:', insertError);
      console.error('Employee data that failed:', newEmployeeData);
      throw insertError;
    }
    
    console.log('Employee created successfully with company_id:', employeeData);
    
    // If we have a new employee ID and work pattern data, save the work patterns
    if (employeeData && employeeData.length > 0) {
      const employeeId = employeeData[0].id;
      
      // Get work patterns data, either from the form or use default with payrollId
      const workPatterns = prepareWorkPatterns(emp);
      
      // Insert work patterns for the employee with payroll_id
      const workPatternsToInsert = prepareWorkPatternsForInsert(workPatterns, employeeId, normalizedPayrollId);
      
      const { error: patternsError } = await supabase
        .from('work_patterns')
        .insert(workPatternsToInsert);
        
      if (patternsError) {
        console.error("Failed to insert work patterns:", patternsError);
        // We don't throw this error as the employee was successfully created
      }
    }
  }
  
  console.log('All employees created successfully with company assignments');
};
