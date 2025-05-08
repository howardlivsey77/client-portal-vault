
import { ColumnMapping, availableFields } from "../ImportConstants";

export const autoMapColumns = (headers: string[]): ColumnMapping[] => {
  const mappings: ColumnMapping[] = [];
  
  // Create lowercase versions for easier matching
  const lowercaseHeaders = headers.map(h => h.toLowerCase());
  
  headers.forEach((header, index) => {
    const lowerHeader = header.toLowerCase();
    let targetField: string | null = null;
    
    // Improved name field mappings
    if (lowerHeader.includes('employee name') || lowerHeader === 'name' || lowerHeader === 'first name' || lowerHeader === 'firstname') {
      targetField = 'first_name';
    }
    else if (lowerHeader === 'last name' || lowerHeader === 'lastname' || lowerHeader === 'surname') {
      targetField = 'last_name';
    }
    // Common department mappings
    else if (lowerHeader === 'dept' || lowerHeader === 'department') {
      targetField = 'department';
    }
    // Email mappings
    else if (lowerHeader === 'email' || lowerHeader === 'email address' || lowerHeader.includes('email')) {
      targetField = 'email';
    }
    // Payroll ID mappings
    else if (lowerHeader === 'payroll id' || lowerHeader === 'employee id' || lowerHeader === 'id') {
      targetField = 'payroll_id';
    }
    // Address mappings
    else if (lowerHeader === 'address line 1' || lowerHeader === 'address1') {
      targetField = 'address1';
    }
    else if (lowerHeader === 'address line 2' || lowerHeader === 'address2') {
      targetField = 'address2';
    }
    else if (lowerHeader === 'address line 3' || lowerHeader === 'address3') {
      targetField = 'address3';
    }
    else if (lowerHeader === 'address line 4' || lowerHeader === 'address4') {
      targetField = 'address4';
    }
    else if (lowerHeader === 'post code' || lowerHeader === 'postcode' || lowerHeader === 'zip' || lowerHeader === 'zip code') {
      targetField = 'postcode';
    }
    // Date fields
    else if (lowerHeader === 'dob' || lowerHeader === 'date of birth') {
      targetField = 'date_of_birth';
    }
    else if (lowerHeader === 'hire date' || lowerHeader === 'start date' || lowerHeader.includes('hire')) {
      targetField = 'hire_date';
    }
    // Rates and hours
    else if (lowerHeader === 'hourly rate' || lowerHeader === 'rate' || lowerHeader === 'hourly rate of pay') {
      targetField = 'hourly_rate';
    }
    else if (lowerHeader === 'rate 2') {
      targetField = 'rate_2';
    }
    else if (lowerHeader === 'rate 3') {
      targetField = 'rate_3';
    }
    else if (lowerHeader === 'rate 4') {
      targetField = 'rate_4';
    }
    else if (lowerHeader.includes('hours') && lowerHeader.includes('week')) {
      targetField = 'hours_per_week';
    }
    // Work pattern fields
    else if (lowerHeader.includes('monday') && lowerHeader.includes('working')) {
      targetField = 'monday_working';
    }
    else if (lowerHeader.includes('monday') && lowerHeader.includes('start')) {
      targetField = 'monday_start_time';
    }
    else if (lowerHeader.includes('monday') && lowerHeader.includes('end')) {
      targetField = 'monday_end_time';
    }
    // Add mapping patterns for other days of the week...
    
    // Try to find an exact match if we didn't catch it with the rules above
    if (!targetField) {
      const cleanHeader = lowerHeader.replace(/[^a-z0-9]/g, '_');
      
      // Try to find an exact match in available fields
      const exactMatch = availableFields.find(field => field === cleanHeader);
      if (exactMatch) {
        targetField = exactMatch;
      }
    }
    
    mappings.push({
      sourceColumn: header,
      targetField: targetField
    });
  });

  console.log("Generated column mappings:", mappings);
  return mappings;
};
