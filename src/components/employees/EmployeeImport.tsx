
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileSpreadsheet } from "lucide-react";
import { FileUploader } from "./import/FileUploader";
import { ColumnMappingUI } from "./import/ColumnMapping";
import { EmployeePreview } from "./import/EmployeePreview";
import { transformData, saveMappings, loadSavedMappings } from "./import/ImportUtils";
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
  const { toast } = useToast();

  const handleFileProcessed = (
    rawData: EmployeeData[],
    preview: EmployeeData[],
    columnMappings: ColumnMapping[],
    headers: string[]
  ) => {
    console.log("File processed:", { rawData, preview, columnMappings });
    setRawData(rawData);
    setPreview(preview);
    setColumnMappings(columnMappings);
    setOriginalHeaders(headers);
    setFile(file);
    
    // Check if we need to show mapping UI - always show when file is uploaded
    const shouldShowMapping = rawData.length > 0 && (preview.length === 0 || headers.length > 0);
    setShowMappingUI(shouldShowMapping);
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
    console.log("Applying mappings:", columnMappings);
    const transformedData = transformData(rawData, columnMappings);
    console.log("Transformed data:", transformedData);
    setPreview(transformedData);
    setShowMappingUI(false);
    
    // Automatically save mappings when they're applied
    saveMappings(columnMappings);
    
    toast({
      title: "Mappings applied",
      description: `${transformedData.length} valid employees found.`,
    });
  };
  
  const handleImport = async () => {
    if (!preview.length) {
      toast({
        title: "No valid data found",
        description: "Please upload a file with valid employee data.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Prepare employees data
      const employees = preview.map(emp => ({
        first_name: emp.first_name,
        last_name: emp.last_name,
        job_title: emp.job_title,
        department: emp.department,
        salary: emp.salary,
        hours_per_week: emp.hours_per_week || 40,
        hourly_rate: emp.hourly_rate || 0,
        email: emp.email || null,
        phone_number: emp.phone_number || null,
        address1: emp.address1 || null,
        address2: emp.address2 || null,
        address3: emp.address3 || null,
        address4: emp.address4 || null,
        postcode: emp.postcode || null,
        emergency_contact: emp.emergency_contact || null,
        date_of_birth: emp.date_of_birth || null,
        hire_date: emp.hire_date || null,
        payroll_id: emp.payroll_id || null,
        user_id: user.id,
      }));
      
      console.log("Importing employees:", employees);
      
      // Insert employees
      const { error } = await supabase
        .from("employees")
        .insert(employees);
      
      if (error) throw error;
      
      toast({
        title: "Import successful",
        description: `${employees.length} employees have been imported.`,
      });
      
      onSuccess();
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Error importing employees",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
          onClick={handleImport} 
          disabled={loading || preview.length === 0}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import {preview.length} Employees
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
