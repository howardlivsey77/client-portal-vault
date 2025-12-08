
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks";
import { readFileData, autoMapColumns } from "./ImportUtils";
import { transformData } from "./dataTransformUtils";
import { EmployeeData, ColumnMapping } from "./ImportConstants";
import { findExistingEmployees } from "@/hooks/employees/import/employeeImportService";

interface FileUploaderProps {
  onFileProcessed: (
    rawData: EmployeeData[], 
    preview: EmployeeData[], 
    columnMappings: ColumnMapping[], 
    headers: string[], 
    existingEmployees: EmployeeData[]
  ) => void;
  disabled: boolean;
}

export const FileUploader = ({
  onFileProcessed,
  disabled
}: FileUploaderProps) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    try {
      // Parse file data
      const { data, headers } = await readFileData(selectedFile);
      console.log("File parsed successfully, headers:", headers);

      if (!data || data.length === 0) {
        toast({
          title: "No data found",
          description: "The selected file does not contain any data.",
          variant: "destructive"
        });
        return;
      }

      // Detect if this is a CSV file
      const isCSVFile = selectedFile.name.toLowerCase().endsWith('.csv');
      console.log("File type detected - CSV:", isCSVFile);

      // Attempt automatic mapping
      const mappings = autoMapColumns(headers);
      console.log("Column mappings generated:", mappings);

      // Transform the data based on mappings and file type
      const transformedData = transformData(data, mappings, isCSVFile);
      console.log("Transformed data:", transformedData);
      
      // Check for existing employees based on email or first name + last name
      const existingEmployees = await findExistingEmployees(transformedData);
      
      // Pass the data back to parent component including existing employee data
      onFileProcessed(data, transformedData, mappings, headers, existingEmployees);
    } catch (error: any) {
      console.error("Error processing file:", error);
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
        className="px-0 my-[2px] mx-0" 
      />
      <p className="text-sm text-muted-foreground">
        File must contain columns for first name, last name, department.
        Additional fields like email, address, hourly rates, etc. can also be imported.
        <br />
        <strong>CSV files:</strong> Use DD/MM/YYYY format for dates (e.g., 22/04/2025 for April 22, 2025)
      </p>
    </div>
  );
};
