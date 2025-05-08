
import { EmployeeData, ColumnMapping } from "@/components/employees/import/ImportConstants";

// Check if required fields are mapped
export const areRequiredFieldsMapped = (mappings: ColumnMapping[]): boolean => {
  const requiredFields = ["first_name", "last_name", "department"];
  return requiredFields.every(requiredField => 
    mappings.some(mapping => mapping.targetField === requiredField)
  );
};

// Enhanced compare function with better handling of various data formats
export const compareEmployees = (
  preview: EmployeeData[],
  existingEmployees: EmployeeData[]
): {
  newEmployees: EmployeeData[];
  updatedEmployees: {existing: EmployeeData; imported: EmployeeData}[];
} => {
  const newEmps: EmployeeData[] = [];
  const updatedEmps: {existing: EmployeeData; imported: EmployeeData}[] = [];
  
  // First, validate we have existing employees data
  console.log(`Comparing ${preview.length} imported records against ${existingEmployees.length} existing employees`);
  
  preview.forEach(importedEmp => {
    // Normalize data for comparison - handle more formats and edge cases
    const importedEmail = importedEmp.email ? String(importedEmp.email).toLowerCase().trim() : null;
    const importedPayrollId = importedEmp.payroll_id ? String(importedEmp.payroll_id).trim() : null;
    
    // Name matching vars (for fallback)
    const importedFirstName = importedEmp.first_name ? String(importedEmp.first_name).trim().toLowerCase() : '';
    const importedLastName = importedEmp.last_name ? String(importedEmp.last_name).trim().toLowerCase() : '';
    
    // Find matching existing employee by email OR payroll_id (OR name as last resort)
    const existingEmp = existingEmployees.find(existing => {
      // Match by payroll ID if both have valid payroll IDs
      if (importedPayrollId && existing.payroll_id) {
        const existingPayrollId = String(existing.payroll_id).trim();
        if (existingPayrollId === importedPayrollId) {
          console.log(`Found match by payroll ID: ${importedPayrollId} for employee ${importedEmp.first_name} ${importedEmp.last_name}`);
          return true;
        }
      }
      
      // Match by email if both have valid emails
      if (importedEmail && existing.email) {
        const existingEmail = String(existing.email).toLowerCase().trim();
        if (existingEmail === importedEmail) {
          console.log(`Found match by email: ${importedEmail} for employee ${importedEmp.first_name} ${importedEmp.last_name}`);
          return true;
        }
      }
      
      // As last resort, try to match by full name if both first and last name match perfectly
      // Only use this if no payroll ID or email is available
      if (!importedPayrollId && !importedEmail && 
          importedFirstName && importedLastName && 
          existing.first_name && existing.last_name) {
        
        const existingFirstName = String(existing.first_name).trim().toLowerCase();
        const existingLastName = String(existing.last_name).trim().toLowerCase();
        
        if (existingFirstName === importedFirstName && existingLastName === importedLastName) {
          console.log(`Found match by name: ${importedFirstName} ${importedLastName}`);
          return true;
        }
      }
      
      return false;
    });
    
    if (existingEmp) {
      console.log(`Employee found - treating as update: ${existingEmp.first_name} ${existingEmp.last_name} (ID: ${existingEmp.id})`);
      
      // Always add to updatedEmps if we found a match - it's clearly an update operation
      updatedEmps.push({
        existing: existingEmp,
        imported: importedEmp
      });
    } else {
      console.log(`No match found - treating as new employee: ${importedEmp.first_name} ${importedEmp.last_name}`);
      newEmps.push(importedEmp);
    }
  });
  
  console.log(`Comparison results: ${newEmps.length} new employees, ${updatedEmps.length} employees to update`);
  return { newEmployees: newEmps, updatedEmployees: updatedEmps };
};
