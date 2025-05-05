
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EmployeeData, ColumnMapping } from "@/components/employees/import/ImportConstants";
import { createNewEmployees, updateExistingEmployees } from "@/services/employeeImportService";

export const useEmployeeImport = (onSuccess: () => void) => {
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<EmployeeData[]>([]);
  const [preview, setPreview] = useState<EmployeeData[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [showMappingUI, setShowMappingUI] = useState(false);
  const [originalHeaders, setOriginalHeaders] = useState<string[]>([]);
  const [existingEmployees, setExistingEmployees] = useState<EmployeeData[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [newEmployees, setNewEmployees] = useState<EmployeeData[]>([]);
  const [updatedEmployees, setUpdatedEmployees] = useState<{existing: EmployeeData; imported: EmployeeData}[]>([]);
  const { toast } = useToast();

  // Handle files processed from the FileUploader component
  const handleFileProcessed = (
    rawData: EmployeeData[],
    preview: EmployeeData[],
    columnMappings: ColumnMapping[],
    headers: string[],
    existingEmps: EmployeeData[]
  ) => {
    setRawData(rawData);
    setPreview(preview);
    setColumnMappings(columnMappings);
    setOriginalHeaders(headers);
    setExistingEmployees(existingEmps);
    
    // Check if we need to show mapping UI based on required fields
    const allRequiredMapped = areRequiredFieldsMapped(columnMappings);
    setShowMappingUI(!allRequiredMapped || preview.length === 0);
  };
  
  // Update column mapping when user changes it in UI
  const updateColumnMapping = (sourceColumn: string, targetField: string | null) => {
    setColumnMappings(prevMappings => 
      prevMappings.map(mapping => 
        mapping.sourceColumn === sourceColumn 
          ? { ...mapping, targetField } 
          : mapping
      )
    );
  };

  // Helper function to check if required fields are mapped
  const areRequiredFieldsMapped = (mappings: ColumnMapping[]): boolean => {
    // Defined locally to avoid circular imports
    const requiredFields = ["first_name", "last_name", "department"];
    return requiredFields.every(requiredField => 
      mappings.some(mapping => mapping.targetField === requiredField)
    );
  };
  
  // Apply mappings and generate preview data
  const applyMappings = (transformData: (data: EmployeeData[], mappings: ColumnMapping[]) => EmployeeData[], 
                         saveMappings: (mappings: ColumnMapping[]) => void) => {
    const transformedData = transformData(rawData, columnMappings);
    setPreview(transformedData);
    setShowMappingUI(false);
    
    saveMappings(columnMappings);
    
    if (transformedData.length === 0) {
      toast({
        title: "No valid data found",
        description: "Please check your column mappings to ensure required fields are mapped correctly.",
        variant: "destructive"
      });
      setShowMappingUI(true);
    } else {
      toast({
        title: "Mappings applied successfully",
        description: `${transformedData.length} employee records are ready to import.`
      });
    }
  };
  
  // Prepare data for import and show confirmation dialog
  const prepareImport = () => {
    if (!preview.length) {
      toast({
        title: "No valid data found",
        description: "Please upload a file with valid employee data.",
        variant: "destructive"
      });
      return;
    }
    
    const newEmps: EmployeeData[] = [];
    const updatedEmps: {existing: EmployeeData; imported: EmployeeData}[] = [];
    
    preview.forEach(importedEmp => {
      const existingEmp = existingEmployees.find(existing => 
        existing.email && importedEmp.email && 
        existing.email.toLowerCase() === importedEmp.email.toLowerCase()
      );
      
      if (existingEmp) {
        const hasChanges = Object.keys(importedEmp).some(key => {
          if (key === 'id' || key.startsWith('rate_')) return false;
          
          return importedEmp[key] !== undefined && 
                importedEmp[key] !== null && 
                importedEmp[key] !== '' && 
                importedEmp[key] !== existingEmp[key];
        });
        
        if (hasChanges) {
          updatedEmps.push({
            existing: existingEmp,
            imported: importedEmp
          });
        }
      } else {
        newEmps.push(importedEmp);
      }
    });
    
    setNewEmployees(newEmps);
    setUpdatedEmployees(updatedEmps);
    
    if (newEmps.length > 0 || updatedEmps.length > 0) {
      setShowConfirmDialog(true);
    } else {
      toast({
        title: "No changes detected",
        description: "All employees are already up to date."
      });
    }
  };
  
  // Execute the import operation
  const handleImport = async () => {
    setLoading(true);
    
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Process new employees
      await createNewEmployees(newEmployees, user.id);
      
      // Process updated employees
      await updateExistingEmployees(updatedEmployees);
      
      toast({
        title: "Import successful",
        description: `${newEmployees.length} employees added and ${updatedEmployees.length} employees updated.`,
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error importing employees",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };
  
  return {
    loading,
    preview,
    columnMappings,
    showMappingUI,
    showConfirmDialog,
    newEmployees,
    updatedEmployees,
    handleFileProcessed,
    updateColumnMapping,
    applyMappings,
    prepareImport,
    handleImport,
    setShowConfirmDialog
  };
};
