
import { supabase } from "@/integrations/supabase/client";
import { EmployeeData } from "@/components/employees/import/ImportConstants";
import { createNewEmployees, updateExistingEmployees } from "@/services/employeeImport";
import { performComprehensiveDuplicateCheck, DuplicateCheckResult } from "@/services/employeeImport/duplicateChecker";
import { EmployeeConflict } from "./enhancedEmployeeMatching";

export interface ImportResult {
  success: boolean;
  message: string;
  error?: any;
  duplicateCheckResult?: DuplicateCheckResult;
  conflicts?: EmployeeConflict[];
}

export interface ImportValidationResult {
  canProceed: boolean;
  duplicateCheckResult: DuplicateCheckResult;
  conflicts: EmployeeConflict[];
  message: string;
}

/**
 * Validate import data before processing
 */
export const validateImportData = async (
  newEmployees: EmployeeData[],
  updatedEmployees: { existing: EmployeeData; imported: EmployeeData }[],
  conflicts: EmployeeConflict[] = []
): Promise<ImportValidationResult> => {
  console.log('Validating import data...');
  
  // Combine all import data for duplicate checking
  const allImportData = [
    ...newEmployees,
    ...updatedEmployees.map(update => update.imported)
  ];
  
  // Perform comprehensive duplicate check
  const duplicateCheckResult = await performComprehensiveDuplicateCheck(allImportData);
  
  // Determine if we can proceed
  const hasBlockingIssues = duplicateCheckResult.hasInternalDuplicates || 
                           duplicateCheckResult.hasDatabaseDuplicates ||
                           conflicts.length > 0;
  
  let message = '';
  if (duplicateCheckResult.hasInternalDuplicates) {
    const issues = [];
    if (duplicateCheckResult.internalDuplicates.payrollIds.length > 0) {
      issues.push(`Duplicate Payroll IDs: ${duplicateCheckResult.internalDuplicates.payrollIds.join(', ')}`);
    }
    if (duplicateCheckResult.internalDuplicates.emails.length > 0) {
      issues.push(`Duplicate Emails: ${duplicateCheckResult.internalDuplicates.emails.join(', ')}`);
    }
    if (duplicateCheckResult.internalDuplicates.nationalInsuranceNumbers.length > 0) {
      issues.push(`Duplicate National Insurance Numbers: ${duplicateCheckResult.internalDuplicates.nationalInsuranceNumbers.join(', ')}`);
    }
    message += `Internal duplicates found in import data: ${issues.join('; ')}. `;
  }
  
  if (duplicateCheckResult.hasDatabaseDuplicates) {
    const issues = [];
    if (duplicateCheckResult.databaseDuplicates.payrollIds.length > 0) {
      issues.push(`Payroll IDs: ${duplicateCheckResult.databaseDuplicates.payrollIds.join(', ')}`);
    }
    if (duplicateCheckResult.databaseDuplicates.emails.length > 0) {
      issues.push(`Emails: ${duplicateCheckResult.databaseDuplicates.emails.join(', ')}`);
    }
    if (duplicateCheckResult.databaseDuplicates.nationalInsuranceNumbers.length > 0) {
      issues.push(`National Insurance Numbers: ${duplicateCheckResult.databaseDuplicates.nationalInsuranceNumbers.join(', ')}`);
    }
    message += `Duplicates found in database: ${issues.join('; ')}. `;
  }
  
  if (conflicts.length > 0) {
    message += `${conflicts.length} employee matching conflicts detected. `;
  }
  
  if (!hasBlockingIssues) {
    message = `Validation passed. Ready to import ${newEmployees.length} new employees and update ${updatedEmployees.length} existing employees.`;
  }
  
  return {
    canProceed: !hasBlockingIssues,
    duplicateCheckResult,
    conflicts,
    message
  };
};

// Handle the import operation
export const executeImport = async (
  newEmployees: EmployeeData[],
  updatedEmployees: { existing: EmployeeData; imported: EmployeeData }[],
  conflicts: EmployeeConflict[] = []
): Promise<ImportResult> => {
  try {
    // Validate before proceeding
    const validation = await validateImportData(newEmployees, updatedEmployees, conflicts);
    
    if (!validation.canProceed) {
      return {
        success: false,
        message: validation.message,
        duplicateCheckResult: validation.duplicateCheckResult,
        conflicts: validation.conflicts
      };
    }
    
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Process new employees
    await createNewEmployees(newEmployees, user.id);
    
    // Process updated employees
    await updateExistingEmployees(updatedEmployees);
    
    return {
      success: true,
      message: `${newEmployees.length} employees added and ${updatedEmployees.length} employees updated.`,
      duplicateCheckResult: validation.duplicateCheckResult
    };
  } catch (error: any) {
    // Check for specific database constraint violations
    if (error.message && error.message.includes("unique_payroll_id")) {
      return {
        success: false,
        message: "Import failed: One or more employees have duplicate payroll IDs. Each employee must have a unique payroll ID.",
        error
      };
    }
    
    return {
      success: false,
      message: error.message || "Error importing employees",
      error
    };
  }
};

// Check for existing employees
export const findExistingEmployees = async (importData: EmployeeData[]): Promise<EmployeeData[]> => {
  try {
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
    
    // Check for existing employees with matching emails
    const { data: emailMatches, error: emailError } = await supabase
      .from("employees")
      .select("*")
      .in("email", emails.length > 0 ? emails : ['no-emails-found']);
    
    if (emailError) throw emailError;
    
    // Check for existing employees with matching payroll IDs
    const { data: payrollMatches, error: payrollError } = await supabase
      .from("employees")
      .select("*")
      .in("payroll_id", payrollIds.length > 0 ? payrollIds : ['no-payroll-ids-found']);
    
    if (payrollError) throw payrollError;
    
    // Check for existing employees with matching National Insurance Numbers
    const { data: niMatches, error: niError } = await supabase
      .from("employees")
      .select("*")
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
