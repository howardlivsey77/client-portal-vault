import { ColumnMapping } from "./ImportConstants";

// Helper to map column headers to database fields
const fieldMappings: Record<string, string[]> = {
  first_name: ['first name', 'firstname', 'first', 'name', 'given name'],
  last_name: ['last name', 'lastname', 'surname', 'family name'],
  department: ['department', 'dept', 'team', 'section', 'division'],
  hours_per_week: ['hours per week', 'weekly hours', 'contracted hours'],
  hourly_rate: ['hourly rate', 'rate', 'pay rate', 'basic rate', 'basic hourly rate'],
  date_of_birth: ['date of birth', 'dob', 'birth date', 'birthday'],
  hire_date: ['hire date', 'start date', 'joining date', 'employment date'],
  email: ['email', 'email address', 'e-mail', 'mail'],
  address1: ['address 1', 'address line 1', 'street address', 'address'],
  address2: ['address 2', 'address line 2'],
  address3: ['address 3', 'address line 3', 'city', 'town'],
  address4: ['address 4', 'address line 4', 'county', 'state', 'province'],
  postcode: ['postcode', 'zip', 'zip code', 'postal code'],
  payroll_id: ['payroll id', 'employee id', 'staff id', 'payroll number', 'employee number', 'id'],
  gender: ['gender', 'sex'],
  rate_2: ['rate 2', 'rate2', 'second rate', 'overtime rate'],
  rate_3: ['rate 3', 'rate3', 'third rate', 'weekend rate'],
  rate_4: ['rate 4', 'rate4', 'fourth rate', 'special rate'],
  
  // Work pattern fields
  monday_working: ['monday working', 'monday', 'mon working', 'mon works'],
  monday_start_time: ['monday start', 'monday start time', 'mon start', 'mon start time'],
  monday_end_time: ['monday end', 'monday end time', 'mon end', 'mon end time'],
  
  tuesday_working: ['tuesday working', 'tuesday', 'tue working', 'tue works'],
  tuesday_start_time: ['tuesday start', 'tuesday start time', 'tue start', 'tue start time'],
  tuesday_end_time: ['tuesday end', 'tuesday end time', 'tue end', 'tue end time'],
  
  wednesday_working: ['wednesday working', 'wednesday', 'wed working', 'wed works'],
  wednesday_start_time: ['wednesday start', 'wednesday start time', 'wed start', 'wed start time'],
  wednesday_end_time: ['wednesday end', 'wednesday end time', 'wed end', 'wed end time'],
  
  thursday_working: ['thursday working', 'thursday', 'thu working', 'thu works'],
  thursday_start_time: ['thursday start', 'thursday start time', 'thu start', 'thu start time'],
  thursday_end_time: ['thursday end', 'thursday end time', 'thu end', 'thu end time'],
  
  friday_working: ['friday working', 'friday', 'fri working', 'fri works'],
  friday_start_time: ['friday start', 'friday start time', 'fri start', 'fri start time'],
  friday_end_time: ['friday end', 'friday end time', 'fri end', 'fri end time'],
  
  saturday_working: ['saturday working', 'saturday', 'sat working', 'sat works'],
  saturday_start_time: ['saturday start', 'saturday start time', 'sat start', 'sat start time'],
  saturday_end_time: ['saturday end', 'saturday end time', 'sat end', 'sat end time'],
  
  sunday_working: ['sunday working', 'sunday', 'sun working', 'sun works'],
  sunday_start_time: ['sunday start', 'sunday start time', 'sun start', 'sun start time'],
  sunday_end_time: ['sunday end', 'sunday end time', 'sun end', 'sun end time'],
};

// Auto-map columns based on header names
export const autoMapColumns = (headers: string[]): ColumnMapping[] => {
  const mappings: ColumnMapping[] = [];
  
  headers.forEach(header => {
    const lowerHeader = header.toLowerCase().trim();
    let mapped = false;
    
    // Check if the header matches any known field
    Object.entries(fieldMappings).forEach(([fieldName, aliases]) => {
      if (!mapped && aliases.includes(lowerHeader)) {
        mappings.push({
          sourceColumn: header,
          targetField: fieldName
        });
        mapped = true;
      }
    });
    
    // If no match was found, add it as unmapped
    if (!mapped) {
      mappings.push({
        sourceColumn: header,
        targetField: null
      });
    }
  });
  
  return mappings;
};

// Check if required fields are mapped
export const areRequiredFieldsMapped = (
  columnMappings: ColumnMapping[],
  requiredFields = ["first_name", "last_name", "department"]
): boolean => {
  return requiredFields.every(requiredField => 
    columnMappings.some(mapping => mapping.targetField === requiredField)
  );
};

// Save column mappings to localStorage
export const saveMappings = (mappings: ColumnMapping[]): void => {
  try {
    localStorage.setItem('columnMappings', JSON.stringify(mappings));
  } catch (e) {
    console.error("Failed to save mappings to localStorage:", e);
  }
};

// Load saved mappings from localStorage
export const loadSavedMappings = (headers: string[]): ColumnMapping[] | null => {
  try {
    const savedMappings = localStorage.getItem('columnMappings');
    if (savedMappings) {
      const parsedMappings: ColumnMapping[] = JSON.parse(savedMappings);
      
      // Check if the headers match the saved mappings
      const currentHeaders = new Set(headers);
      const savedHeaders = new Set(parsedMappings.map(m => m.sourceColumn));
      
      // If the headers match exactly, we can use the saved mappings
      if (currentHeaders.size === savedHeaders.size && 
          [...currentHeaders].every(h => savedHeaders.has(h))) {
        return parsedMappings;
      }
      
      // Otherwise, try to map the current headers based on saved mappings
      return headers.map(header => {
        const savedMapping = parsedMappings.find(m => m.sourceColumn === header);
        if (savedMapping) {
          return savedMapping;
        } else {
          return { sourceColumn: header, targetField: null };
        }
      });
    }
  } catch (e) {
    console.error("Failed to load mappings from localStorage:", e);
  }
  
  return null;
};

// Clear saved mappings from localStorage
export const clearSavedMappings = (): void => {
  try {
    localStorage.removeItem('columnMappings');
  } catch (e) {
    console.error("Failed to clear mappings from localStorage:", e);
  }
};
