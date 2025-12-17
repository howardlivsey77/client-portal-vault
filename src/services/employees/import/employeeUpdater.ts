
import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { roundToTwoDecimals } from "@/lib/formatters";
import { checkDuplicatePayrollIds } from "./duplicateChecker";
import { extractNewPayrollIds, normalizePayrollId } from "./payrollIdUtils";
import { getCompanyIdAsync } from "@/utils/company/getCompanyId";

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

  // Get the current company ID using centralized utility
  const companyId = await getCompanyIdAsync();
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
    
    // Previously missing fields - now included
    if (imported.gender !== undefined && imported.gender !== null && imported.gender !== '') {
      updateData.gender = imported.gender;
    }
    if (imported.national_insurance_number !== undefined && imported.national_insurance_number !== null && imported.national_insurance_number !== '') {
      updateData.national_insurance_number = imported.national_insurance_number;
    }
    if (imported.tax_code !== undefined && imported.tax_code !== null && imported.tax_code !== '') {
      updateData.tax_code = imported.tax_code;
    }
    if (imported.nic_code !== undefined && imported.nic_code !== null && imported.nic_code !== '') {
      updateData.nic_code = imported.nic_code;
    }
    if (imported.work_pattern !== undefined && imported.work_pattern !== null && imported.work_pattern !== '') {
      updateData.work_pattern = imported.work_pattern;
    }
    if (imported.week_one_month_one !== undefined && imported.week_one_month_one !== null) {
      updateData.week_one_month_one = imported.week_one_month_one;
    }
    if (imported.student_loan_plan !== undefined && imported.student_loan_plan !== null) {
      updateData.student_loan_plan = imported.student_loan_plan;
    }
    if (imported.sickness_scheme_id !== undefined && imported.sickness_scheme_id !== null) {
      updateData.sickness_scheme_id = imported.sickness_scheme_id;
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
