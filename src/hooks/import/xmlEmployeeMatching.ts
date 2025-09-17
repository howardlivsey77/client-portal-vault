import { EmployeeData } from "@/components/employees/import/ImportConstants";

// Enhanced employee matching for XML imports using Pay ID and National Insurance Number
export const matchXMLEmployees = (
  xmlEmployees: EmployeeData[],
  existingEmployees: EmployeeData[]
): {
  newEmployees: EmployeeData[];
  updatedEmployees: {existing: EmployeeData; imported: EmployeeData}[];
  unmatchedXML: EmployeeData[];
} => {
  const newEmps: EmployeeData[] = [];
  const updatedEmps: {existing: EmployeeData; imported: EmployeeData}[] = [];
  const unmatchedXML: EmployeeData[] = [];

  xmlEmployees.forEach(importedEmp => {
    let existingEmp = null;
    
    // Primary matching: Try to match by payroll_id (Pay ID from XML)
    if (importedEmp.payroll_id && importedEmp.payroll_id.trim() !== '') {
      existingEmp = existingEmployees.find(existing => 
        existing.payroll_id && 
        existing.payroll_id.trim() === importedEmp.payroll_id.trim()
      );
    }
    
    // Secondary matching: Try to match by National Insurance Number
    if (!existingEmp && importedEmp.national_insurance_number && importedEmp.national_insurance_number.trim() !== '') {
      existingEmp = existingEmployees.find(existing => 
        existing.national_insurance_number && 
        existing.national_insurance_number.trim() === importedEmp.national_insurance_number.trim()
      );
    }
    
    // Tertiary matching: Try to match by full name (first + last name)
    if (!existingEmp && importedEmp.first_name && importedEmp.last_name) {
      existingEmp = existingEmployees.find(existing => 
        existing.first_name && existing.last_name &&
        existing.first_name.toLowerCase().trim() === importedEmp.first_name.toLowerCase().trim() &&
        existing.last_name.toLowerCase().trim() === importedEmp.last_name.toLowerCase().trim()
      );
    }
    
    if (existingEmp) {
      // Check if there are meaningful changes to update
      const hasChanges = hasSignificantChanges(existingEmp, importedEmp);
      
      if (hasChanges) {
        updatedEmps.push({
          existing: existingEmp,
          imported: importedEmp
        });
      }
    } else {
      // No match found - this is a new employee
      // However, since XML doesn't contain department, email, hire date, etc.
      // we'll mark it as unmatched for manual review
      if (!importedEmp.department || !importedEmp.email || !importedEmp.hire_date) {
        unmatchedXML.push(importedEmp);
      } else {
        newEmps.push(importedEmp);
      }
    }
  });

  return { 
    newEmployees: newEmps, 
    updatedEmployees: updatedEmps,
    unmatchedXML: unmatchedXML
  };
};

// Check if there are significant changes between existing and imported employee
const hasSignificantChanges = (existing: EmployeeData, imported: EmployeeData): boolean => {
  // Fields that we consider for updates from XML
  const xmlUpdateFields = [
    'first_name',
    'last_name', 
    'national_insurance_number',
    'payroll_id',
    'gender',
    'date_of_birth',
    'address1',
    'address2',
    'address3', 
    'address4',
    'postcode',
    'tax_code',
    'nic_code'
  ];

  return xmlUpdateFields.some(field => {
    const importedValue = imported[field];
    const existingValue = existing[field];
    
    // Only consider it a change if imported value is meaningful and different
    return importedValue && 
           importedValue.toString().trim() !== '' &&
           importedValue.toString().trim() !== existingValue?.toString().trim();
  });
};