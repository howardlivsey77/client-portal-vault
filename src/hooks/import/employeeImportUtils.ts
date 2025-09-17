
import { EmployeeData, ColumnMapping, requiredFields } from "@/components/employees/import/ImportConstants";
import { compareEmployeesEnhanced, EmployeeConflict } from "./enhancedEmployeeMatching";
import { matchXMLEmployees } from "./xmlEmployeeMatching";

// Check if required fields are mapped
export const areRequiredFieldsMapped = (mappings: ColumnMapping[]): boolean => {
  return requiredFields.every(requiredField => 
    mappings.some(mapping => mapping.targetField === requiredField)
  );
};

// Enhanced compare employees using the new matching logic
export const compareEmployees = (
  preview: EmployeeData[],
  existingEmployees: EmployeeData[],
  isXMLImport: boolean = false
): {
  newEmployees: EmployeeData[];
  updatedEmployees: {existing: EmployeeData; imported: EmployeeData}[];
  conflicts?: EmployeeConflict[];
  unmatchedXML?: EmployeeData[];
} => {
  if (isXMLImport) {
    const xmlResult = matchXMLEmployees(preview, existingEmployees);
    return {
      newEmployees: xmlResult.newEmployees,
      updatedEmployees: xmlResult.updatedEmployees,
      unmatchedXML: xmlResult.unmatchedXML
    };
  }
  return compareEmployeesEnhanced(preview, existingEmployees);
};

// Legacy function kept for backward compatibility
export const compareEmployeesLegacy = (
  preview: EmployeeData[],
  existingEmployees: EmployeeData[]
): {
  newEmployees: EmployeeData[];
  updatedEmployees: {existing: EmployeeData; imported: EmployeeData}[];
} => {
  const newEmps: EmployeeData[] = [];
  const updatedEmps: {existing: EmployeeData; imported: EmployeeData}[] = [];
  
  preview.forEach(importedEmp => {
    // First try to match by payroll_id (if both have payroll_id)
    let existingEmp = null;
    
    if (importedEmp.payroll_id && importedEmp.payroll_id.trim() !== '') {
      existingEmp = existingEmployees.find(existing => 
        existing.payroll_id && 
        existing.payroll_id.trim() === importedEmp.payroll_id.trim()
      );
    }
    
    // If no payroll_id match found, try to match by email
    if (!existingEmp && importedEmp.email && importedEmp.email.trim() !== '') {
      existingEmp = existingEmployees.find(existing => 
        existing.email && 
        existing.email.toLowerCase() === importedEmp.email.toLowerCase()
      );
    }
    
    if (existingEmp) {
      // Check for changes in standard fields
      const hasStandardChanges = Object.keys(importedEmp).some(key => {
        if (key === 'id' || key.startsWith('rate_')) return false;
        
        return importedEmp[key] !== undefined && 
              importedEmp[key] !== null && 
              importedEmp[key] !== '' && 
              importedEmp[key] !== existingEmp[key];
      });

      // Check for changes in rate fields - consider any imported rates as changes
      // since we want to always update them if present
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
    } else {
      newEmps.push(importedEmp);
    }
  });
  
  return { newEmployees: newEmps, updatedEmployees: updatedEmps };
};
