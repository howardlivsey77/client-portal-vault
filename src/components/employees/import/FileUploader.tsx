
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { readFileData, autoMapColumns, transformData, hasDuplicatePayrollIds } from "./ImportUtils";
import { EmployeeData, ColumnMapping } from "./ImportConstants";
import { findExistingEmployees } from "@/services/employeeImport";
import { WorkPatternImportGuide } from "./WorkPatternImportGuide";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

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

      // Attempt automatic mapping
      const mappings = autoMapColumns(headers);
      console.log("Column mappings generated:", mappings);

      // Transform the data based on mappings
      const transformedData = transformData(data, mappings);
      console.log("Transformed data:", transformedData);
      
      if (transformedData.length === 0) {
        toast({
          title: "No valid data found",
          description: "Could not extract employee data. Please check your file format and column mappings.",
          variant: "destructive"
        });
        return;
      }
      
      // Check for duplicate payroll IDs within the imported data
      const { hasDuplicates, duplicates } = hasDuplicatePayrollIds(transformedData);
      if (hasDuplicates) {
        toast({
          title: "Duplicate payroll IDs detected",
          description: `Your import contains duplicate payroll IDs: ${duplicates.join(', ')}. Please ensure all payroll IDs are unique.`,
          variant: "destructive"
        });
        return;
      }
      
      // Check for existing employees based on email and payroll ID
      toast({
        title: "Processing file",
        description: "Checking for existing employees to update...",
      });
      
      const existingEmployees = await findExistingEmployees(transformedData);
      
      if (existingEmployees.length > 0) {
        toast({
          title: "Found existing employees",
          description: `Found ${existingEmployees.length} existing employees that will be updated instead of created.`,
        });
      }
      
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="file">Upload Excel or CSV file</Label>
        <WorkPatternImportGuide />
      </div>
      
      <Alert className="mb-4 bg-blue-50">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Employee Update Process</AlertTitle>
        <AlertDescription>
          To update existing employees, include either their email address or payroll ID in the file.
          Employees will be matched based on these fields and updated instead of creating duplicates.
        </AlertDescription>
      </Alert>
      
      <Input 
        id="file" 
        type="file" 
        accept=".xlsx,.xls,.csv" 
        onChange={handleFileChange} 
        disabled={disabled} 
        className="px-0 my-[2px] mx-0" 
      />
      <p className="text-sm text-muted-foreground">
        File must contain columns for first name, last name, and department.
        Updates to existing employees will be detected automatically if email or payroll ID matches.
      </p>
    </div>
  );
};
