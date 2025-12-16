
import { EmployeeData } from "@/components/employees/import/ImportConstants";

export interface EmployeeMatchResult {
  match: EmployeeData | null;
  matchedBy: 'payroll_id' | 'national_insurance_number' | 'email' | null;
  conflicts: EmployeeConflict[];
}

export interface EmployeeConflict {
  type: 'multiple_matches' | 'identifier_mismatch';
  field: 'payroll_id' | 'national_insurance_number' | 'email';
  conflictingEmployees: EmployeeData[];
  message: string;
}

/**
 * Enhanced employee matching using hierarchical matching with all three unique identifiers
 */
export const findEmployeeMatch = (
  importedEmployee: EmployeeData,
  existingEmployees: EmployeeData[]
): EmployeeMatchResult => {
  console.log('Finding match for imported employee:', importedEmployee);
  
  const conflicts: EmployeeConflict[] = [];
  let primaryMatch: EmployeeData | null = null;
  let matchedBy: 'payroll_id' | 'national_insurance_number' | 'email' | null = null;
  
  // Step 1: Try to match by Payroll ID (highest priority)
  if (importedEmployee.payroll_id && importedEmployee.payroll_id.trim() !== '') {
    const payrollMatches = existingEmployees.filter(emp => 
      emp.payroll_id && 
      emp.payroll_id.trim() === importedEmployee.payroll_id.trim()
    );
    
    if (payrollMatches.length === 1) {
      primaryMatch = payrollMatches[0];
      matchedBy = 'payroll_id';
      console.log('Found unique match by payroll_id:', primaryMatch.id);
    } else if (payrollMatches.length > 1) {
      conflicts.push({
        type: 'multiple_matches',
        field: 'payroll_id',
        conflictingEmployees: payrollMatches,
        message: `Multiple employees found with payroll ID: ${importedEmployee.payroll_id}`
      });
    }
  }
  
  // Step 2: If no payroll match, try National Insurance Number
  if (!primaryMatch && importedEmployee.national_insurance_number && importedEmployee.national_insurance_number.trim() !== '') {
    const niMatches = existingEmployees.filter(emp => 
      emp.national_insurance_number && 
      emp.national_insurance_number.trim().toUpperCase() === importedEmployee.national_insurance_number.trim().toUpperCase()
    );
    
    if (niMatches.length === 1) {
      primaryMatch = niMatches[0];
      matchedBy = 'national_insurance_number';
      console.log('Found unique match by national_insurance_number:', primaryMatch.id);
    } else if (niMatches.length > 1) {
      conflicts.push({
        type: 'multiple_matches',
        field: 'national_insurance_number',
        conflictingEmployees: niMatches,
        message: `Multiple employees found with National Insurance Number: ${importedEmployee.national_insurance_number}`
      });
    }
  }
  
  // Step 3: If no match yet, try Email
  if (!primaryMatch && importedEmployee.email && importedEmployee.email.trim() !== '') {
    const emailMatches = existingEmployees.filter(emp => 
      emp.email && 
      emp.email.toLowerCase() === importedEmployee.email.toLowerCase()
    );
    
    if (emailMatches.length === 1) {
      primaryMatch = emailMatches[0];
      matchedBy = 'email';
      console.log('Found unique match by email:', primaryMatch.id);
    } else if (emailMatches.length > 1) {
      conflicts.push({
        type: 'multiple_matches',
        field: 'email',
        conflictingEmployees: emailMatches,
        message: `Multiple employees found with email: ${importedEmployee.email}`
      });
    }
  }
  
  // Step 4: Check for identifier conflicts if we found a primary match
  if (primaryMatch) {
    // Check if other identifiers point to different employees
    const conflictChecks = [
      {
        field: 'payroll_id' as const,
        importValue: importedEmployee.payroll_id,
        matchValue: primaryMatch.payroll_id
      },
      {
        field: 'national_insurance_number' as const,
        importValue: importedEmployee.national_insurance_number,
        matchValue: primaryMatch.national_insurance_number
      },
      {
        field: 'email' as const,
        importValue: importedEmployee.email,
        matchValue: primaryMatch.email
      }
    ];
    
    for (const check of conflictChecks) {
      if (check.importValue && check.importValue.trim() !== '' && 
          check.matchValue && check.matchValue.trim() !== '' &&
          check.field !== matchedBy) {
        
        // Normalize values for comparison
        const normalizeValue = (value: string, field: string) => {
          if (field === 'national_insurance_number') return value.trim().toUpperCase();
          if (field === 'email') return value.trim().toLowerCase();
          return value.trim();
        };
        
        const normalizedImport = normalizeValue(check.importValue, check.field);
        const normalizedMatch = normalizeValue(check.matchValue, check.field);
        
        if (normalizedImport !== normalizedMatch) {
          // Check if the imported value matches any other employee
          const otherMatches = existingEmployees.filter(emp => {
            const empValue = emp[check.field];
            return empValue && 
                   normalizeValue(empValue, check.field) === normalizedImport &&
                   emp.id !== primaryMatch!.id;
          });
          
          if (otherMatches.length > 0) {
            conflicts.push({
              type: 'identifier_mismatch',
              field: check.field,
              conflictingEmployees: [primaryMatch, ...otherMatches],
              message: `Employee matched by ${matchedBy} but ${check.field} (${check.importValue}) belongs to different employee(s)`
            });
          }
        }
      }
    }
  }
  
  const result: EmployeeMatchResult = {
    match: primaryMatch,
    matchedBy,
    conflicts
  };
  
  console.log('Employee match result:', result);
  return result;
};

/**
 * Compare employees and detect changes with enhanced matching
 */
export const compareEmployeesEnhanced = (
  preview: EmployeeData[],
  existingEmployees: EmployeeData[]
): {
  newEmployees: EmployeeData[];
  updatedEmployees: {existing: EmployeeData; imported: EmployeeData}[];
  conflicts: EmployeeConflict[];
} => {
  console.log('Comparing employees with enhanced matching');
  
  const newEmps: EmployeeData[] = [];
  const updatedEmps: {existing: EmployeeData; imported: EmployeeData}[] = [];
  const allConflicts: EmployeeConflict[] = [];
  
  preview.forEach(importedEmp => {
    const matchResult = findEmployeeMatch(importedEmp, existingEmployees);
    
    // Collect any conflicts found during matching
    allConflicts.push(...matchResult.conflicts);
    
    if (matchResult.match && matchResult.conflicts.length === 0) {
      // We have a clean match with no conflicts
      const existingEmp = matchResult.match;
      
      // Fields that should only be compared if explicitly provided in the import
      // (not auto-defaulted during transformation)
      const fieldsRequiringExplicitImport = ['hours_per_week', 'hourly_rate', 'department'];
      
      // Check for changes in standard fields - only compare fields that were actually in the import
      const hasStandardChanges = Object.keys(importedEmp).some(key => {
        if (key === 'id' || key.startsWith('rate_')) return false;
        
        // Skip fields that weren't explicitly in the import file
        // These fields are undefined if not in import (since we removed auto-defaults)
        if (fieldsRequiringExplicitImport.includes(key)) {
          // Only compare if the imported value is meaningful (not undefined/null/empty)
          if (importedEmp[key] === undefined || importedEmp[key] === null || importedEmp[key] === '') {
            return false;
          }
        }
        
        return importedEmp[key] !== undefined && 
              importedEmp[key] !== null && 
              importedEmp[key] !== '' && 
              importedEmp[key] !== existingEmp[key];
      });

      // Check for changes in rate fields
      const hasRateChanges = ['rate_2', 'rate_3', 'rate_4'].some(rateKey => 
        importedEmp[rateKey] !== undefined && 
        importedEmp[rateKey] !== null && 
        importedEmp[rateKey] !== ''
      );
      
      if (hasStandardChanges || hasRateChanges) {
        updatedEmps.push({
          existing: existingEmp,
          imported: importedEmp
        });
      }
    } else if (!matchResult.match && matchResult.conflicts.length === 0) {
      // No match found and no conflicts, this is a new employee
      newEmps.push(importedEmp);
    }
    // If there are conflicts, the employee is neither added to new nor updated
    // The conflicts will be reported to the user for resolution
  });
  
  console.log(`Enhanced comparison result: ${newEmps.length} new, ${updatedEmps.length} updates, ${allConflicts.length} conflicts`);
  
  return { 
    newEmployees: newEmps, 
    updatedEmployees: updatedEmps, 
    conflicts: allConflicts 
  };
};
