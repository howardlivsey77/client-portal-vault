
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileSpreadsheet } from "lucide-react";
import { FileUploader } from "./import/FileUploader";
import { ColumnMappingUI } from "./import/ColumnMapping";
import { EmployeePreview } from "./import/EmployeePreview";
import { EmployeeChangesConfirmation } from "./import/EmployeeChangesConfirmation";
import { transformData, saveMappings, areRequiredFieldsMapped } from "./import/ImportUtils";
import { EmployeeData, ColumnMapping } from "./import/ImportConstants";

interface EmployeeImportProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const EmployeeImport = ({ onSuccess, onCancel }: EmployeeImportProps) => {
  const [file, setFile] = useState<File | null>(null);
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
  
  // Update a specific column mapping
  const updateColumnMapping = (sourceColumn: string, targetField: string | null) => {
    setColumnMappings(prevMappings => 
      prevMappings.map(mapping => 
        mapping.sourceColumn === sourceColumn 
          ? { ...mapping, targetField } 
          : mapping
      )
    );
  };
  
  // Apply mappings and update preview
  const applyMappings = () => {
    const transformedData = transformData(rawData, columnMappings);
    setPreview(transformedData);
    setShowMappingUI(false);
    
    // Automatically save mappings when they're applied
    saveMappings(columnMappings);
    
    // Show toast based on the result
    if (transformedData.length === 0) {
      toast({
        title: "No valid data found",
        description: "Please check your column mappings to ensure required fields are mapped correctly.",
        variant: "destructive"
      });
      // Re-open mapping UI if no valid data
      setShowMappingUI(true);
    } else {
      toast({
        title: "Mappings applied successfully",
        description: `${transformedData.length} employee records are ready to import.`
      });
    }
  };
  
  // Prepare for import - analyze changes and show confirmation dialog
  const prepareImport = () => {
    if (!preview.length) {
      toast({
        title: "No valid data found",
        description: "Please upload a file with valid employee data.",
        variant: "destructive"
      });
      return;
    }
    
    // Compare imported data with existing data to find changes
    const newEmps: EmployeeData[] = [];
    const updatedEmps: {existing: EmployeeData; imported: EmployeeData}[] = [];
    
    preview.forEach(importedEmp => {
      // Check if employee exists by email
      const existingEmp = existingEmployees.find(existing => 
        existing.email && importedEmp.email && 
        existing.email.toLowerCase() === importedEmp.email.toLowerCase()
      );
      
      if (existingEmp) {
        // Check if any fields are different
        const hasChanges = Object.keys(importedEmp).some(key => {
          // Skip id and other non-updatable fields
          if (key === 'id') return false;
          
          // Check if the value is different and not empty
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
        // New employee
        newEmps.push(importedEmp);
      }
    });
    
    setNewEmployees(newEmps);
    setUpdatedEmployees(updatedEmps);
    
    // Show confirmation dialog if there are changes
    if (newEmps.length > 0 || updatedEmps.length > 0) {
      setShowConfirmDialog(true);
    } else {
      toast({
        title: "No changes detected",
        description: "All employees are already up to date."
      });
    }
  };
  
  // Execute the import after confirmation
  const handleImport = async () => {
    setLoading(true);
    
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Process new employees
      if (newEmployees.length > 0) {
        const newEmployeesData = newEmployees.map(emp => ({
          first_name: emp.first_name,
          last_name: emp.last_name,
          department: emp.department,
          hours_per_week: emp.hours_per_week || 40,
          hourly_rate: emp.hourly_rate || 0,
          email: emp.email || null,
          address1: emp.address1 || null,
          address2: emp.address2 || null,
          address3: emp.address3 || null,
          address4: emp.address4 || null,
          postcode: emp.postcode || null,
          date_of_birth: emp.date_of_birth || null,
          hire_date: emp.hire_date || null,
          payroll_id: emp.payroll_id || null,
          user_id: user.id,
        }));
        
        const { error: insertError } = await supabase
          .from("employees")
          .insert(newEmployeesData);
        
        if (insertError) throw insertError;
      }
      
      // Process updated employees
      for (const { existing, imported } of updatedEmployees) {
        const updates: any = {};
        
        // Only include fields that have changed
        Object.keys(imported).forEach(key => {
          if (key !== 'id' && imported[key] !== undefined && imported[key] !== null && 
              imported[key] !== '' && imported[key] !== existing[key]) {
            updates[key] = imported[key];
          }
        });
        
        // Update employee if there are changes
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from("employees")
            .update(updates)
            .eq("id", existing.id);
          
          if (updateError) throw updateError;
        }
      }
      
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
  
  return (
    <div className="space-y-6">
      <FileUploader 
        onFileProcessed={handleFileProcessed} 
        disabled={loading} 
      />
      
      {showMappingUI && (
        <ColumnMappingUI 
          columnMappings={columnMappings}
          updateColumnMapping={updateColumnMapping}
          applyMappings={applyMappings}
        />
      )}
      
      <EmployeePreview preview={preview} />
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={prepareImport} 
          disabled={loading || (preview.length === 0)}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Review Changes
            </>
          )}
        </Button>
      </div>
      
      <EmployeeChangesConfirmation
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleImport}
        newEmployees={newEmployees}
        updatedEmployees={updatedEmployees}
      />
    </div>
  );
};
