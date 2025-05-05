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
import { createHourlyRate } from "@/services/hourlyRateService";

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
  
  const updateColumnMapping = (sourceColumn: string, targetField: string | null) => {
    setColumnMappings(prevMappings => 
      prevMappings.map(mapping => 
        mapping.sourceColumn === sourceColumn 
          ? { ...mapping, targetField } 
          : mapping
      )
    );
  };
  
  const applyMappings = () => {
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
        for (const emp of newEmployees) {
          // Extract additional rates
          const additionalRates = {
            rate_2: emp.rate_2,
            rate_3: emp.rate_3,
            rate_4: emp.rate_4
          };
          
          // Remove rate fields from employee data
          const employeeData = { ...emp };
          delete employeeData.rate_2;
          delete employeeData.rate_3;
          delete employeeData.rate_4;
          
          // Insert the employee
          const newEmployeeData = {
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
          };
          
          const { data: employeeInsertData, error: insertError } = await supabase
            .from("employees")
            .insert(newEmployeeData)
            .select()
            .single();
          
          if (insertError) throw insertError;
          
          // Create additional hourly rates if provided
          if (employeeInsertData) {
            await createAdditionalRates(employeeInsertData.id, additionalRates);
          }
        }
      }
      
      // Process updated employees
      for (const { existing, imported } of updatedEmployees) {
        // Extract additional rates
        const additionalRates = {
          rate_2: imported.rate_2,
          rate_3: imported.rate_3,
          rate_4: imported.rate_4
        };
        
        const updates: any = {};
        
        // Only include fields that have changed and are not rate fields
        Object.keys(imported).forEach(key => {
          if (key !== 'id' && !key.startsWith('rate_') && 
              imported[key] !== undefined && imported[key] !== null && 
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
        
        // Create additional hourly rates if provided
        await createAdditionalRates(existing.id, additionalRates);
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
  
  const createAdditionalRates = async (employeeId: string, rates: { rate_2?: any, rate_3?: any, rate_4?: any }) => {
    try {
      // Create Rate 2 if provided and valid
      if (rates.rate_2 && !isNaN(Number(rates.rate_2)) && Number(rates.rate_2) > 0) {
        await createHourlyRate({
          employee_id: employeeId,
          rate_name: "Rate 2",
          hourly_rate: Number(rates.rate_2),
          is_default: false
        });
      }
      
      // Create Rate 3 if provided and valid
      if (rates.rate_3 && !isNaN(Number(rates.rate_3)) && Number(rates.rate_3) > 0) {
        await createHourlyRate({
          employee_id: employeeId,
          rate_name: "Rate 3",
          hourly_rate: Number(rates.rate_3),
          is_default: false
        });
      }
      
      // Create Rate 4 if provided and valid
      if (rates.rate_4 && !isNaN(Number(rates.rate_4)) && Number(rates.rate_4) > 0) {
        await createHourlyRate({
          employee_id: employeeId,
          rate_name: "Rate 4",
          hourly_rate: Number(rates.rate_4),
          is_default: false
        });
      }
    } catch (error) {
      console.error("Error creating additional hourly rates:", error);
      // Continue with the import even if rate creation fails
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
