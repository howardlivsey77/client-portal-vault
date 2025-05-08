
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { readFileData, autoMapColumns, transformData, hasDuplicatePayrollIds } from "./ImportUtils";
import { EmployeeData, ColumnMapping } from "./ImportConstants";
import { findExistingEmployees } from "@/services/employeeImport";
import { WorkPatternImportGuide } from "./WorkPatternImportGuide";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, AlertCircle } from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    setError(null);
    setIsProcessing(true);
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    try {
      // Parse file data
      const { data, headers } = await readFileData(selectedFile);
      console.log("File parsed successfully, headers:", headers);
      console.log("Sample data from file:", data.slice(0, 2));

      if (!data || data.length === 0) {
        setError("No data found in the selected file. Please check the file content.");
        toast({
          title: "No data found",
          description: "The selected file does not contain any data.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      // Attempt automatic mapping
      const mappings = autoMapColumns(headers);
      console.log("Column mappings generated:", mappings);

      // Transform the data based on mappings
      const transformedData = transformData(data, mappings);
      console.log("Transformed data sample:", transformedData.slice(0, 2));
      
      if (transformedData.length === 0) {
        setError("Could not extract valid employee data. This usually means required fields like first name, last name and department are missing or not mapped correctly. Please check the file format or map columns manually.");
        toast({
          title: "No valid data found",
          description: "Could not extract required employee data. Please check your file format and manually map the columns.",
          variant: "destructive"
        });
        
        // Even though we couldn't transform data, we'll still pass the raw data and mappings
        // This allows the user to manually map columns
        onFileProcessed(data, [], mappings, headers, []);
        setIsProcessing(false);
        return;
      }
      
      // Check for duplicate payroll IDs within the imported data
      const { hasDuplicates, duplicates } = hasDuplicatePayrollIds(transformedData);
      if (hasDuplicates) {
        setError(`Duplicate payroll IDs detected: ${duplicates.join(', ')}. Please ensure all payroll IDs are unique.`);
        toast({
          title: "Duplicate payroll IDs detected",
          description: `Your import contains duplicate payroll IDs: ${duplicates.join(', ')}. Please ensure all payroll IDs are unique.`,
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      
      // Check for existing employees based on email and payroll ID
      toast({
        title: "Processing file",
        description: "Checking for existing employees to update...",
      });
      
      try {
        const existingEmployees = await findExistingEmployees(transformedData);
        
        if (existingEmployees.length > 0) {
          toast({
            title: "Found existing employees",
            description: `Found ${existingEmployees.length} existing employees that will be updated instead of created.`,
          });
        }
        
        // Pass the data back to parent component including existing employee data
        onFileProcessed(data, transformedData, mappings, headers, existingEmployees);
      } catch (dbError: any) {
        console.error("Error fetching existing employees:", dbError);
        toast({
          title: "Warning",
          description: "Could not check for existing employees. Import will treat all records as new employees.",
          variant: "destructive"
        });
        // Still proceed with the import but without existing employee data
        onFileProcessed(data, transformedData, mappings, headers, []);
      }
    } catch (error: any) {
      console.error("Error processing file:", error);
      setError(error.message || "Failed to process file");
      toast({
        title: "Error parsing file",
        description: error.message || "Please make sure your file is a valid Excel or CSV file.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
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
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Processing File</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Input 
        id="file" 
        type="file" 
        accept=".xlsx,.xls,.csv" 
        onChange={handleFileChange} 
        disabled={disabled || isProcessing} 
        className="px-0 my-[2px] mx-0" 
      />
      <p className="text-sm text-muted-foreground mt-2">
        File must contain columns for first name, last name, and department.
        Updates to existing employees will be detected automatically if email or payroll ID matches.
      </p>
      {isProcessing && (
        <p className="text-sm text-amber-600">Processing file, please wait...</p>
      )}
    </div>
  );
};
