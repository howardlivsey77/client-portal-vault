
import { EmployeeData, ColumnMapping } from "@/components/employees/import/ImportConstants";

// Check if required fields are mapped
export const areRequiredFieldsMapped = (mappings: ColumnMapping[]): boolean => {
  const requiredFields = ["first_name", "last_name", "department"];
  return requiredFields.every(requiredField => 
    mappings.some(mapping => mapping.targetField === requiredField)
  );
};

// Compare employees and detect changes
export const compareEmployees = (
  preview: EmployeeData[],
  existingEmployees: EmployeeData[]
): {
  newEmployees: EmployeeData[];
  updatedEmployees: {existing: EmployeeData; imported: EmployeeData}[];
} => {
  const newEmps: EmployeeData[] = [];
  const updatedEmps: {existing: EmployeeData; imported: EmployeeData}[] = [];
  
  preview.forEach(importedEmp => {
    // Find by email OR payroll_id to better match existing employees
    const existingEmp = existingEmployees.find(existing => 
      (existing.email && importedEmp.email && 
       existing.email.toLowerCase() === importedEmp.email.toLowerCase()) ||
      (existing.payroll_id && importedEmp.payroll_id && 
       existing.payroll_id.trim() === importedEmp.payroll_id.trim())
    );
    
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
