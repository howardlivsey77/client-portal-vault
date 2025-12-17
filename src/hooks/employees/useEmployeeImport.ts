import { useReducer } from "react";
import { useToast } from "@/hooks";
import { EmployeeData, ColumnMapping } from "@/components/employees/import/ImportConstants";
import {
  employeeImportReducer,
  initialState,
  areRequiredFieldsMapped,
  compareEmployees,
  executeImport,
  findExistingEmployees,
  validateImportData,
  EmployeeConflict
} from "./import";
import { getCompanyId } from "@/utils/company/getCompanyId";

export const useEmployeeImport = (onSuccess: () => void) => {
  const [state, dispatch] = useReducer(employeeImportReducer, initialState);
  const { toast } = useToast();
  
  // Handle files processed from the FileUploader component
  const handleFileProcessed = (
    rawData: EmployeeData[],
    preview: EmployeeData[],
    columnMappings: ColumnMapping[],
    headers: string[],
    existingEmps: EmployeeData[]
  ) => {
    // Check if we need to show mapping UI based on required fields
    const allRequiredMapped = areRequiredFieldsMapped(columnMappings);
    
    dispatch({ 
      type: 'FILE_PROCESSED', 
      payload: { 
        rawData, 
        preview, 
        columnMappings, 
        headers, 
        existingEmployees: existingEmps,
        showMappingUI: !allRequiredMapped || preview.length === 0
      }
    });

    // Clear any previous errors
    dispatch({ 
      type: 'SET_IMPORT_ERROR',
      payload: null 
    });
  };
  
  // Update column mapping when user changes it in UI
  const updateColumnMapping = (sourceColumn: string, targetField: string | null) => {
    dispatch({ 
      type: 'UPDATE_COLUMN_MAPPING', 
      payload: { sourceColumn, targetField } 
    });
  };
  
  // Apply mappings and generate preview data
  const applyMappings = (
    transformData: (data: EmployeeData[], mappings: ColumnMapping[], isCSVFile?: boolean) => EmployeeData[], 
    saveMappings: (mappings: ColumnMapping[]) => void
  ) => {
    // Note: We'll need to detect file type from the original file name
    // For now, we'll pass false as default since the file type detection happens in FileUploader
    const transformedData = transformData(state.rawData, state.columnMappings);
    dispatch({ type: 'SET_PREVIEW', payload: transformedData });
    dispatch({ type: 'SET_SHOW_MAPPING_UI', payload: false });
    
    saveMappings(state.columnMappings);
    
    if (transformedData.length === 0) {
      toast({
        title: "No valid data found",
        description: "Please check your column mappings to ensure required fields are mapped correctly.",
        variant: "destructive"
      });
      dispatch({ type: 'SET_SHOW_MAPPING_UI', payload: true });
    } else {
      toast({
        title: "Mappings applied successfully",
        description: `${transformedData.length} employee records are ready to import.`
      });
    }
  };
  
  
  // Prepare data for import and show confirmation dialog
  const prepareImport = async () => {
    if (!state.preview.length) {
      toast({
        title: "No valid data found",
        description: "Please upload a file with valid employee data.",
        variant: "destructive"
      });
      return;
    }
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const comparisonResult = compareEmployees(state.preview, state.existingEmployees);
      const { newEmployees, updatedEmployees, conflicts = [] } = comparisonResult;
      
      // Validate the import data (scoped to current company)
      const companyId = getCompanyId() || undefined;
      const validation = await validateImportData(newEmployees, updatedEmployees, conflicts, companyId);
      
      if (!validation.canProceed) {
        toast({
          title: "Import validation failed",
          description: validation.message,
          variant: "destructive"
        });
        
        dispatch({ 
          type: 'SET_IMPORT_ERROR',
          payload: validation.message
        });
        
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      
      dispatch({ 
        type: 'PREPARE_IMPORT', 
        payload: { newEmployees, updatedEmployees } 
      });
      
      if (newEmployees.length > 0 || updatedEmployees.length > 0) {
        dispatch({ type: 'SET_SHOW_CONFIRM_DIALOG', payload: true });
        toast({
          title: "Import ready",
          description: `${newEmployees.length} new employees and ${updatedEmployees.length} updates ready for import.`
        });
      } else {
        toast({
          title: "No changes detected",
          description: "All employees are already up to date."
        });
      }
    } catch (error: any) {
      toast({
        title: "Error preparing import",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
      
      dispatch({ 
        type: 'SET_IMPORT_ERROR',
        payload: error.message || "Error preparing import"
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };
  
  // Execute the import operation
  const handleImport = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_IMPORT_ERROR', payload: null });
    
    const result = await executeImport(state.newEmployees, state.updatedEmployees, [], getCompanyId() || undefined);
    
    if (result.success) {
      toast({
        title: "Import successful",
        description: result.message,
      });
      
      onSuccess();
    } else {
      toast({
        title: "Error importing employees",
        description: result.message,
        variant: "destructive"
      });
      
      dispatch({ 
        type: 'SET_IMPORT_ERROR',
        payload: result.message
      });
    }
    
    dispatch({ type: 'SET_LOADING', payload: false });
    dispatch({ type: 'SET_SHOW_CONFIRM_DIALOG', payload: false });
  };
  
  // Set show confirm dialog
  const setShowConfirmDialog = (show: boolean) => {
    dispatch({ type: 'SET_SHOW_CONFIRM_DIALOG', payload: show });
  };
  
  return {
    ...state,
    handleFileProcessed,
    updateColumnMapping,
    applyMappings,
    prepareImport,
    handleImport,
    setShowConfirmDialog
  };
};
