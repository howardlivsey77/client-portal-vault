
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
    const existingEmp = existingEmployees.find(existing => 
      existing.email && importedEmp.email && 
      existing.email.toLowerCase() === importedEmp.email.toLowerCase()
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

      // Check for changes in rate fields
      const hasRateChanges = ['rate_2', 'rate_3', 'rate_4'].some(rateKey => 
        importedEmp[rateKey] !== undefined && 
        importedEmp[rateKey] !== null && 
        importedEmp[rateKey] !== '' && 
        // Consider any imported rate as a change since we can't easily compare with existing rates
        !!importedEmp[rateKey]
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
