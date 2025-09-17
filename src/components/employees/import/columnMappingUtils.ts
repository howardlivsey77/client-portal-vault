

import { ColumnMapping, availableFields, requiredFields } from "./ImportConstants";

// Enhanced mapping patterns for common field variations
const fieldMappingPatterns: Record<string, string[]> = {
  "first_name": [
    "first name", "firstname", "name", "given name", "forename", "christian name", "first", "fname"
  ],
  "last_name": [
    "last name", "lastname", "surname", "family name", "last", "lname"
  ],
  "department": [
    "department", "dept", "division", "section", "team", "job title", "position", "role"
  ],
  "hours_per_week": [
    "hours per week", "weekly hours", "hours/week", "standard hours", "contracted hours"
  ],
  "hourly_rate": [
    "hourly rate", "rate", "pay rate", "wage", "salary", "basic rate", "standard rate"
  ],
  "date_of_birth": [
    "date of birth", "dob", "birth date", "birthdate", "born"
  ],
  "hire_date": [
    "hire date", "start date", "employment date", "joined", "commenced", "started"
  ],
  "email": [
    "email", "e-mail", "email address", "e-mail address", "mail"
  ],
  "address1": [
    "address", "address1", "address line 1", "street", "street address", "house number"
  ],
  "address2": [
    "address2", "address line 2", "apartment", "flat", "unit"
  ],
  "address3": [
    "address3", "address line 3", "city", "town"
  ],
  "address4": [
    "address4", "address line 4", "county", "state", "region"
  ],
  "postcode": [
    "postcode", "postal code", "zip", "zip code"
  ],
  "payroll_id": [
    "payroll id", "employee id", "staff id", "works number", "emp id", "id", "number"
  ],
  "gender": [
    "gender", "sex"
  ],
  "rate_2": [
    "rate 2", "rate2", "overtime rate", "ot rate", "second rate"
  ],
  "rate_3": [
    "rate 3", "rate3", "third rate", "weekend rate"
  ],
  "rate_4": [
    "rate 4", "rate4", "fourth rate", "holiday rate", "bank holiday rate"
  ],
  "national_insurance_number": [
    "national insurance number", "ni number", "nino", "nin", "national insurance", "ni no", "ni num"
  ],
  "nic_code": [
    "nic code", "ni code", "national insurance code", "contribution code", "nic", "ni contribution code"
  ]
};

// Normalize text for comparison
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
    .trim();
};

// Check if two strings are similar (for fuzzy matching)
const isSimilar = (str1: string, str2: string): boolean => {
  const normalized1 = normalizeText(str1);
  const normalized2 = normalizeText(str2);
  
  // Exact match
  if (normalized1 === normalized2) return true;
  
  // One contains the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true;
  
  return false;
};

// Find the best field match for a header
const findBestFieldMatch = (header: string): string | null => {
  const normalizedHeader = normalizeText(header);
  
  console.log(`Trying to match header: "${header}" (normalized: "${normalizedHeader}")`);
  
  // First, try exact matches with our mapping patterns
  for (const [field, patterns] of Object.entries(fieldMappingPatterns)) {
    for (const pattern of patterns) {
      if (isSimilar(header, pattern)) {
        console.log(`Matched "${header}" to ${field} via pattern "${pattern}"`);
        return field;
      }
    }
  }
  
  // If no pattern match, try direct field name matching
  for (const field of availableFields) {
    if (isSimilar(header, field.replace(/_/g, ' '))) {
      console.log(`Direct match: "${header}" to ${field}`);
      return field;
    }
  }
  
  console.log(`No match found for "${header}"`);
  return null;
};

// Automatically map columns based on similarity
export const autoMapColumns = (headers: string[]): ColumnMapping[] => {
  console.log("Auto-mapping headers:", headers);
  
  // Try to load saved mappings first
  const savedMappings = loadSavedMappings();
  
  // If we have saved mappings that match our headers, use those
  if (savedMappings && headers.every(header => 
    savedMappings.some(mapping => mapping.sourceColumn === header)
  )) {
    console.log("Using saved mappings");
    return savedMappings;
  }
  
  // Otherwise, perform auto-mapping
  const mappings = headers.map(header => {
    const targetField = findBestFieldMatch(header);
    
    console.log(`Mapping "${header}" -> "${targetField}"`);
    
    return { 
      sourceColumn: header, 
      targetField: targetField 
    };
  });
  
  console.log("Generated mappings:", mappings);
  return mappings;
};

// Save column mappings to localStorage
export const saveMappings = (mappings: ColumnMapping[]): void => {
  try {
    localStorage.setItem('employeeImportMappings', JSON.stringify(mappings));
  } catch (error) {
    console.error("Failed to save column mappings:", error);
  }
};

// Load saved column mappings from localStorage
export const loadSavedMappings = (): ColumnMapping[] | null => {
  try {
    const savedMappings = localStorage.getItem('employeeImportMappings');
    return savedMappings ? JSON.parse(savedMappings) : null;
  } catch (error) {
    console.error("Failed to load saved column mappings:", error);
    return null;
  }
};

// Clear saved mappings
export const clearSavedMappings = (): void => {
  try {
    localStorage.removeItem('employeeImportMappings');
  } catch (error) {
    console.error("Failed to clear saved column mappings:", error);
  }
};

// Check if all required fields are mapped - fixed signature to match usage
export const areRequiredFieldsMapped = (columnMappings: ColumnMapping[]): boolean => {
  // Check if every required field has at least one column mapped to it
  return requiredFields.every(requiredField => 
    columnMappings.some(mapping => mapping.targetField === requiredField)
  );
};
