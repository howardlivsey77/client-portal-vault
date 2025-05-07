import { ColumnMapping, availableFields } from "./ImportConstants";

// Automatically map columns based on similarity
export const autoMapColumns = (headers: string[]): ColumnMapping[] => {
  // Try to load saved mappings first
  const savedMappings = loadSavedMappings();
  
  // If we have saved mappings that match our headers, use those
  if (savedMappings && headers.every(header => 
    savedMappings.some(mapping => mapping.sourceColumn === header)
  )) {
    return savedMappings;
  }
  
  // Otherwise, perform auto-mapping
  return headers.map(header => {
    const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Try to find an exact match first
    const exactMatch = availableFields.find(field => 
      field.toLowerCase() === header.toLowerCase()
    );
    
    if (exactMatch) {
      return { sourceColumn: header, targetField: exactMatch };
    }
    
    // Special case for rate fields
    if (/rate\s*2/i.test(header)) {
      return { sourceColumn: header, targetField: "rate_2" };
    }
    
    if (/rate\s*3/i.test(header)) {
      return { sourceColumn: header, targetField: "rate_3" };
    }
    
    if (/rate\s*4/i.test(header)) {
      return { sourceColumn: header, targetField: "rate_4" };
    }
    
    // Then try to find a partial match
    for (const field of availableFields) {
      const normalizedField = field.toLowerCase();
      if (normalizedHeader.includes(normalizedField) || normalizedField.includes(normalizedHeader)) {
        return { sourceColumn: header, targetField: field };
      }
    }
    
    // Check if we have a saved mapping for this header
    const savedMapping = savedMappings?.find(mapping => mapping.sourceColumn === header);
    if (savedMapping) {
      return savedMapping;
    }
    
    // No match found
    return { sourceColumn: header, targetField: null };
  });
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

// Check if all required fields are mapped
export const areRequiredFieldsMapped = (columnMappings: ColumnMapping[], requiredFields: string[]): boolean => {
  // Check if every required field has at least one column mapped to it
  return requiredFields.every(requiredField => 
    columnMappings.some(mapping => mapping.targetField === requiredField)
  );
};
