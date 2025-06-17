
import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { roundToTwoDecimals } from "@/lib/formatters";
import { checkDuplicatePayrollIds } from "./duplicateChecker";
import { extractNewPayrollIds, normalizePayrollId } from "./payrollIdUtils";

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
 * Process updated employees and update them in the database
 */
export const updateExistingEmployees = async (
  updatedEmployees: {existing: EmployeeData; imported: EmployeeData}[]
): Promise<void> => {
  console.log('Updating existing employees. Count:', updatedEmployees.length);
  
  if (updatedEmployees.length === 0) {
    console.log('No employees to update');
    return;
  }

  // Get the current company ID for updates
  const companyId = await getCurrentCompanyId();
  console.log('Updating employees with company ID:', companyId);

  // Check for any new payroll IDs that might conflict with existing ones
  const newPayrollIds = extractNewPayrollIds(updatedEmployees);
  
  if (newPayrollIds.length > 0) {
    console.log('Checking for duplicate payroll IDs in updates:', newPayrollIds);
    const existingPayrollIds = await checkDuplicatePayrollIds(newPayrollIds);
    
    if (existingPayrollIds.length > 0) {
      console.error('Database duplicates found in updates:', existingPayrollIds);
      throw new Error(`Cannot update: duplicate payroll IDs found: ${existingPayrollIds.join(', ')}`);
    }
  }
  
  for (const { existing, imported } of updatedEmployees) {
    console.log(`Updating employee ID ${existing.id} with data:`, imported);
    
    const normalizedPayrollId = normalizePayrollId(imported.payroll_id);
    console.log(`Employee payroll_id: "${imported.payroll_id}" -> normalized: "${normalizedPayrollId}"`);
    
    // Prepare update data - only include fields that have values
    const updateData: Partial<EmployeeData & { company_id: string }> = {};
    
    // Standard fields
    if (imported.first_name !== undefined && imported.first_name !== null && imported.first_name !== '') {
      updateData.first_name = imported.first_name;
    }
    if (imported.last_name !== undefined && imported.last_name !== null && imported.last_name !== '') {
      updateData.last_name = imported.last_name;
    }
    if (imported.department !== undefined && imported.department !== null && imported.department !== '') {
      updateData.department = imported.department;
    }
    if (imported.email !== undefined && imported.email !== null && imported.email !== '') {
      updateData.email = imported.email;
    }
    if (imported.hours_per_week !== undefined && imported.hours_per_week !== null) {
      updateData.hours_per_week = imported.hours_per_week;
    }
    if (imported.hourly_rate !== undefined && imported.hourly_rate !== null) {
      updateData.hourly_rate = roundToTwoDecimals(imported.hourly_rate);
    }
    
    // Address fields
    if (imported.address1 !== undefined && imported.address1 !== null && imported.address1 !== '') {
      updateData.address1 = imported.address1;
    }
    if (imported.address2 !== undefined && imported.address2 !== null && imported.address2 !== '') {
      updateData.address2 = imported.address2;
    }
    if (imported.address3 !== undefined && imported.address3 !== null && imported.address3 !== '') {
      updateData.address3 = imported.address3;
    }
    if (imported.address4 !== undefined && imported.address4 !== null && imported.address4 !== '') {
      updateData.address4 = imported.address4;
    }
    if (imported.postcode !== undefined && imported.postcode !== null && imported.postcode !== '') {
      updateData.postcode = imported.postcode;
    }
    
    // Date fields
    if (imported.date_of_birth !== undefined && imported.date_of_birth !== null && imported.date_of_birth !== '') {
      updateData.date_of_birth = imported.date_of_birth;
    }
    if (imported.hire_date !== undefined && imported.hire_date !== null && imported.hire_date !== '') {
      updateData.hire_date = imported.hire_date;
    }
    
    // Payroll ID
    if (normalizedPayrollId !== null) {
      updateData.payroll_id = normalizedPayrollId;
    }
    
    // Rate fields - always update if provided
    if (imported.rate_2 !== undefined && imported.rate_2 !== null) {
      updateData.rate_2 = roundToTwoDecimals(imported.rate_2);
    }
    if (imported.rate_3 !== undefined && imported.rate_3 !== null) {
      updateData.rate_3 = roundToTwoDecimals(imported.rate_3);
    }
    if (imported.rate_4 !== undefined && imported.rate_4 !== null) {
      updateData.rate_4 = roundToTwoDecimals(imported.rate_4);
    }
    
    // Always update company_id if we have one and the existing employee doesn't have one
    if (companyId && !existing.company_id) {
      updateData.company_id = companyId;
      console.log(`Assigning company_id ${companyId} to existing employee ${existing.id}`);
    }
    
    console.log('Prepared update data:', updateData);
    
    if (Object.keys(updateData).length === 0) {
      console.log('No changes to apply for employee:', existing.id);
      continue;
    }
    
    const { error: updateError } = await supabase
      .from("employees")
      .update(updateData)
      .eq("id", existing.id);
    
    if (updateError) {
      console.error('Error updating employee:', updateError);
      console.error('Update data that failed:', updateData);
      throw updateError;
    }
    
    console.log('Employee updated successfully:', existing.id);
  }
  
  console.log('All employees updated successfully');
};
