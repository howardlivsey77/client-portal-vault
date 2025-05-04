
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { readFileData, autoMapColumns, transformData } from "./ImportUtils";
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
      
      // Pass the data back to parent component
      onFileProcessed(data, transformedData, mappings, headers);
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
        File must contain columns for first name, last name, job title, department.
        Additional fields like email, address, etc. can also be imported.
      </p>
    </div>
  );
};
