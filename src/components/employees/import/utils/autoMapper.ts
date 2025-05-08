
import { ColumnMapping } from "../ImportConstants";

// Attempt to find the best match between source column names and target field names
export const autoMapColumns = (headers: string[]): ColumnMapping[] => {
  return headers.map(header => {
    const lowerHeader = header.toLowerCase().trim();
    
    // Direct mappings
    if (lowerHeader.includes('first name') || lowerHeader === 'firstname' || lowerHeader === 'first_name' || lowerHeader === 'givenname') {
      return { sourceColumn: header, targetField: 'first_name' };
    }
    if (lowerHeader.includes('last name') || lowerHeader === 'lastname' || lowerHeader === 'last_name' || lowerHeader === 'surname') {
      return { sourceColumn: header, targetField: 'last_name' };
    }
    if (lowerHeader.includes('department') || lowerHeader === 'dept' || lowerHeader === 'team') {
      return { sourceColumn: header, targetField: 'department' };
    }
    if (lowerHeader.includes('email') || lowerHeader === 'e-mail' || lowerHeader === 'mail address') {
      return { sourceColumn: header, targetField: 'email' };
    }
    if (lowerHeader.includes('address line 1') || lowerHeader === 'address1' || lowerHeader === 'street') {
      return { sourceColumn: header, targetField: 'address1' };
    }
    if (lowerHeader.includes('address line 2') || lowerHeader === 'address2') {
      return { sourceColumn: header, targetField: 'address2' };
    }
    if (lowerHeader.includes('address line 3') || lowerHeader === 'address3') {
      return { sourceColumn: header, targetField: 'address3' };
    }
    if (lowerHeader.includes('address line 4') || lowerHeader === 'address4') {
      return { sourceColumn: header, targetField: 'address4' };
    }
    if (lowerHeader.includes('postcode') || lowerHeader === 'post code' || lowerHeader === 'zip' || lowerHeader === 'zipcode') {
      return { sourceColumn: header, targetField: 'postcode' };
    }
    if (lowerHeader.includes('date of birth') || lowerHeader === 'dob' || lowerHeader === 'birthdate') {
      return { sourceColumn: header, targetField: 'date_of_birth' };
    }
    if (lowerHeader.includes('hire date') || lowerHeader === 'start date' || lowerHeader === 'joining date') {
      return { sourceColumn: header, targetField: 'hire_date' };
    }
    if (lowerHeader.includes('gender') || lowerHeader === 'sex') {
      return { sourceColumn: header, targetField: 'gender' };
    }
    if (lowerHeader.includes('hours per week') || lowerHeader === 'working hours' || lowerHeader === 'weekly hours') {
      return { sourceColumn: header, targetField: 'hours_per_week' };
    }
    if (lowerHeader.includes('hourly rate') || lowerHeader === 'base rate' || lowerHeader === 'pay rate') {
      return { sourceColumn: header, targetField: 'hourly_rate' };
    }
    if (lowerHeader.includes('rate 2')) {
      return { sourceColumn: header, targetField: 'rate_2' };
    }
    if (lowerHeader.includes('rate 3')) {
      return { sourceColumn: header, targetField: 'rate_3' };
    }
    if (lowerHeader.includes('rate 4')) {
      return { sourceColumn: header, targetField: 'rate_4' };
    }
    if (lowerHeader.includes('payroll id') || lowerHeader === 'employee id' || lowerHeader === 'staff id') {
      return { sourceColumn: header, targetField: 'payroll_id' };
    }
    
    // Work pattern mappings with better day handling
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
      // Remove spaces and standardize day name for matching
      const cleanHeader = lowerHeader.replace(/\s+/g, '');
      const cleanDay = day.toLowerCase();
      
      if (cleanHeader === `${cleanDay}working` || 
          cleanHeader === `${cleanDay}_working` || 
          cleanHeader === `${cleanDay}works`) {
        return { sourceColumn: header, targetField: `${day}_working` };
      }
      
      if (cleanHeader.includes(`${cleanDay}start`) || 
          cleanHeader.includes(`${cleanDay}_start`) || 
          cleanHeader.includes(`${cleanDay}from`)) {
        return { sourceColumn: header, targetField: `${day}_start_time` };
      }
      
      if (cleanHeader.includes(`${cleanDay}end`) || 
          cleanHeader.includes(`${cleanDay}_end`) || 
          cleanHeader.includes(`${cleanDay}to`)) {
        return { sourceColumn: header, targetField: `${day}_end_time` };
      }
    }
    
    // No match found
    return { sourceColumn: header, targetField: null };
  });
};
