
import { ColumnMapping } from "../ImportConstants";

// Save column mappings to local storage
export const saveMappings = (mappings: ColumnMapping[]): void => {
  try {
    localStorage.setItem('employee_import_mappings', JSON.stringify(mappings));
  } catch (error) {
    console.error("Error saving mappings to local storage", error);
  }
};

// Load saved column mappings from local storage
export const loadSavedMappings = (): ColumnMapping[] | null => {
  try {
    const savedMappings = localStorage.getItem('employee_import_mappings');
    return savedMappings ? JSON.parse(savedMappings) : null;
  } catch (error) {
    console.error("Error loading mappings from local storage", error);
    return null;
  }
};

// Clear saved mappings from local storage
export const clearSavedMappings = (): void => {
  try {
    localStorage.removeItem('employee_import_mappings');
  } catch (error) {
    console.error("Error clearing mappings from local storage", error);
  }
};
