
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { readFileData, autoMapColumns, transformData, loadSavedMappings } from "./ImportUtils";
import { EmployeeData, ColumnMapping } from "./ImportConstants";

interface FileUploaderProps {
  onFileProcessed: (rawData: EmployeeData[], preview: EmployeeData[], columnMappings: ColumnMapping[], headers: string[]) => void;
  disabled: boolean;
}

export const FileUploader = ({
  onFileProcessed,
  disabled
}: FileUploaderProps) => {
  const { toast } = useToast();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const selectedFile = e.target.files[0];
    console.log("Selected file:", selectedFile);
    
    try {
      // Parse file data
      const { data, headers } = await readFileData(selectedFile);
      console.log("File read complete:", { data: data.length, headers });
      
      // Try to load saved mappings first
      let mappings = loadSavedMappings();
      
      // If no saved mappings or they don't match our headers, attempt automatic mapping
      if (!mappings || !headers.every(header => 
        mappings!.some(mapping => mapping.sourceColumn === header)
      )) {
        mappings = autoMapColumns(headers);
      }
      
      console.log("Applied mappings:", mappings);
      
      // Transform the data with the mappings
      const transformedData = transformData(data, mappings);
      console.log("Transformed data:", transformedData);
      
      // Send processed data back to parent component
      onFileProcessed(data, transformedData, mappings, headers);
    } catch (error: any) {
      console.error("Error parsing file:", error);
      toast({
        title: "Error parsing file",
        description: error.message || "Please make sure your file is a valid Excel or CSV file.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-2">
      <Label htmlFor="file">Upload Excel or CSV file</Label>
      <Input 
        id="file" 
        type="file" 
        accept=".xlsx,.xls,.csv" 
        onChange={handleFileChange} 
        disabled={disabled} 
      />
      <p className="text-sm text-muted-foreground">
        File must contain columns for first name, last name, job title, department, and salary.
        Additional fields like email, phone, address, etc. can also be imported.
      </p>
    </div>
  );
};
