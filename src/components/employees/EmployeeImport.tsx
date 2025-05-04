import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

interface EmployeeData {
  first_name: string;
  last_name: string;
  job_title: string;
  department: string;
  salary: number;
  hours_per_week?: number;
  hourly_rate?: number;
  phone_number?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  address4?: string;
  postcode?: string;
  emergency_contact?: string;
}

interface EmployeeImportProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const EmployeeImport = ({ onSuccess, onCancel }: EmployeeImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<EmployeeData[]>([]);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
    try {
      const data = await readFileData(selectedFile);
      setPreview(data);
    } catch (error) {
      toast({
        title: "Error parsing file",
        description: "Please make sure your file is a valid Excel or CSV file.",
        variant: "destructive"
      });
    }
  };
  
  const readFileData = async (file: File): Promise<EmployeeData[]> => {
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
          
          if (file.name.endsWith('.csv')) {
            // Parse CSV using XLSX
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            parsedData = XLSX.utils.sheet_to_json(worksheet);
          } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            // Parse Excel
            const binary = new Uint8Array(data as ArrayBuffer);
            const workbook = XLSX.read(binary, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            parsedData = XLSX.utils.sheet_to_json(worksheet);
          } else {
            reject("Unsupported file format");
            return;
          }
          
          // Validate required fields
          const validData = parsedData.filter(row => 
            row.first_name && 
            row.last_name && 
            row.job_title && 
            row.department && 
            !isNaN(Number(row.salary))
          ).map(row => ({
            ...row,
            salary: Number(row.salary),
            hours_per_week: row.hours_per_week ? Number(row.hours_per_week) : 40,
            hourly_rate: row.hourly_rate ? Number(row.hourly_rate) : 0
          }));
          
          resolve(validData);
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
          File must contain columns: first_name, last_name, job_title, department, salary.
          Optional: hours_per_week, hourly_rate, phone_number, address1, address2, address3, address4, postcode, emergency_contact.
        </p>
      </div>
      
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
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 5).map((emp, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-1">{emp.first_name} {emp.last_name}</td>
                    <td className="py-1">{emp.job_title}</td>
                    <td className="py-1">{emp.department}</td>
                  </tr>
                ))}
                {preview.length > 5 && (
                  <tr>
                    <td colSpan={3} className="py-1 text-center">
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
        <Button onClick={handleImport} disabled={!preview.length || loading}>
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
