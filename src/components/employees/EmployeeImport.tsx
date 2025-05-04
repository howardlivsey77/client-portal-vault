import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileSpreadsheet, ArrowRight } from "lucide-react";
import * as XLSX from "xlsx";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EmployeeFormValues } from "@/types/employee";

interface EmployeeData {
  [key: string]: any;
}

interface ColumnMapping {
  sourceColumn: string;
  targetField: string | null;
}

interface EmployeeImportProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// Required fields that must be mapped for import to succeed
const requiredFields = [
  "first_name",
  "last_name",
  "job_title",
  "department",
  "salary"
];

// All available fields for mapping - updated to include all employee table columns
const availableFields = [
  "first_name",
  "last_name",
  "job_title",
  "department",
  "salary",
  "hours_per_week",
  "hourly_rate",
  "date_of_birth",
  "hire_date",
  "email",
  "phone_number",
  "address1",
  "address2",
  "address3",
  "address4",
  "postcode",
  "emergency_contact"
];

// Human-readable field labels
const fieldLabels: Record<string, string> = {
  first_name: "First Name",
  last_name: "Last Name",
  job_title: "Job Title",
  department: "Department",
  salary: "Salary",
  hours_per_week: "Hours Per Week",
  hourly_rate: "Hourly Rate",
  date_of_birth: "Date of Birth",
  hire_date: "Hire Date",
  email: "Email Address",
  phone_number: "Phone Number",
  address1: "Address Line 1",
  address2: "Address Line 2",
  address3: "Address Line 3",
  address4: "Address Line 4",
  postcode: "Postcode",
  emergency_contact: "Emergency Contact"
};

export const EmployeeImport = ({ onSuccess, onCancel }: EmployeeImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<EmployeeData[]>([]);
  const [preview, setPreview] = useState<EmployeeData[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [showMappingUI, setShowMappingUI] = useState(false);
  const [originalHeaders, setOriginalHeaders] = useState<string[]>([]);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    try {
      const { data, headers } = await readFileData(selectedFile);
      setRawData(data);
      setOriginalHeaders(headers);
      
      // Attempt automatic mapping
      const mappings = autoMapColumns(headers);
      setColumnMappings(mappings);
      
      // Check if we need to show mapping UI
      const missingRequiredMappings = requiredFields.some(field => 
        !mappings.some(mapping => mapping.targetField === field)
      );
      
      setShowMappingUI(missingRequiredMappings);
      
      if (!missingRequiredMappings) {
        // If we have all required mappings, transform the data
        const transformedData = transformData(data, mappings);
        setPreview(transformedData);
      } else {
        setPreview([]);
      }
    } catch (error) {
      toast({
        title: "Error parsing file",
        description: "Please make sure your file is a valid Excel or CSV file.",
        variant: "destructive"
      });
    }
  };
  
  const readFileData = async (file: File): Promise<{data: EmployeeData[], headers: string[]}> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject("No data found in file");
            return;
          }
          
          let parsedData: EmployeeData[] = [];
          let headers: string[] = [];
          
          if (file.name.endsWith('.csv')) {
            // Parse CSV using XLSX
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            parsedData = XLSX.utils.sheet_to_json(worksheet);
            
            // Extract headers
            if (parsedData.length > 0) {
              headers = Object.keys(parsedData[0]);
            }
          } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            // Parse Excel
            const binary = new Uint8Array(data as ArrayBuffer);
            const workbook = XLSX.read(binary, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            parsedData = XLSX.utils.sheet_to_json(worksheet);
            
            // Extract headers
            if (parsedData.length > 0) {
              headers = Object.keys(parsedData[0]);
            }
          } else {
            reject("Unsupported file format");
            return;
          }
          
          resolve({
            data: parsedData,
            headers: headers
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      
      if (file.name.endsWith('.csv')) {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };
  
  // Automatically map columns based on similarity
  const autoMapColumns = (headers: string[]): ColumnMapping[] => {
    return headers.map(header => {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Try to find an exact match first
      const exactMatch = availableFields.find(field => 
        field.toLowerCase() === header.toLowerCase()
      );
      
      if (exactMatch) {
        return { sourceColumn: header, targetField: exactMatch };
      }
      
      // Then try to find a partial match
      for (const field of availableFields) {
        const normalizedField = field.toLowerCase();
        if (normalizedHeader.includes(normalizedField) || normalizedField.includes(normalizedHeader)) {
          return { sourceColumn: header, targetField: field };
        }
      }
      
      // No match found
      return { sourceColumn: header, targetField: null };
    });
  };
  
  // Transform raw data based on column mappings
  const transformData = (data: EmployeeData[], mappings: ColumnMapping[]): EmployeeData[] => {
    return data.map(row => {
      const transformedRow: EmployeeData = {};
      
      mappings.forEach(mapping => {
        if (mapping.targetField && row[mapping.sourceColumn] !== undefined) {
          transformedRow[mapping.targetField] = row[mapping.sourceColumn];
        }
      });
      
      // Set default values for missing fields
      if (!transformedRow.hours_per_week) transformedRow.hours_per_week = 40;
      if (!transformedRow.hourly_rate) transformedRow.hourly_rate = 0;
      
      // Convert numeric fields
      if (transformedRow.salary) transformedRow.salary = Number(transformedRow.salary);
      if (transformedRow.hours_per_week) transformedRow.hours_per_week = Number(transformedRow.hours_per_week);
      if (transformedRow.hourly_rate) transformedRow.hourly_rate = Number(transformedRow.hourly_rate);
      
      return transformedRow;
    }).filter(row => 
      // Filter out rows without required fields
      requiredFields.every(field => row[field] !== undefined && row[field] !== null && row[field] !== '')
    );
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
  };
  
  // Check if all required fields are mapped
  const areRequiredFieldsMapped = () => {
    return requiredFields.every(field => 
      columnMappings.some(mapping => mapping.targetField === field)
    );
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
        user_id: user.id,
      }));
      
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
      <div className="space-y-2">
        <Label htmlFor="file">Upload Excel or CSV file</Label>
        <Input
          id="file"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          disabled={loading}
        />
        <p className="text-sm text-muted-foreground">
          File must contain columns for first name, last name, job title, department, and salary.
          Additional fields like email, phone, address, etc. can also be imported.
        </p>
      </div>
      
      {showMappingUI && (
        <div className="border rounded-md p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Column Mapping</h3>
            <Button 
              variant="outline"
              size="sm"
              onClick={applyMappings}
              disabled={!areRequiredFieldsMapped()}
            >
              Apply Mapping
            </Button>
          </div>
          
          {!areRequiredFieldsMapped() && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Missing required fields</AlertTitle>
              <AlertDescription>
                Please map all required fields: First Name, Last Name, Job Title, Department, and Salary.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="max-h-60 overflow-auto space-y-2">
            {columnMappings.map((mapping, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-1/3 truncate">
                  <Label>{mapping.sourceColumn}</Label>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="w-2/3">
                  <Select
                    value={mapping.targetField || "none"}
                    onValueChange={(value) => updateColumnMapping(mapping.sourceColumn, value === "none" ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Do not import</SelectItem>
                      {availableFields.map(field => (
                        <SelectItem key={field} value={field}>
                          {fieldLabels[field] || field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {preview.length > 0 && (
        <div className="border rounded-md p-4">
          <h3 className="text-sm font-medium mb-2">
            Preview: {preview.length} employees found
          </h3>
          <div className="max-h-60 overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Position</th>
                  <th className="text-left py-2">Department</th>
                  <th className="text-left py-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 5).map((emp, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-1">{emp.first_name} {emp.last_name}</td>
                    <td className="py-1">{emp.job_title}</td>
                    <td className="py-1">{emp.department}</td>
                    <td className="py-1">{emp.email || "-"}</td>
                  </tr>
                ))}
                {preview.length > 5 && (
                  <tr>
                    <td colSpan={4} className="py-1 text-center">
                      ...{preview.length - 5} more
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleImport} 
          disabled={(showMappingUI && !areRequiredFieldsMapped()) || !preview.length || loading}
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
