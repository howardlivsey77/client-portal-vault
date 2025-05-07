
import { useState, useEffect } from "react";
import { FileText, Clock, Calendar, Users, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatCurrency, roundToTwoDecimals } from "@/lib/formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExtraHoursSummary, EmployeeHoursData } from "./types";

interface UploadSummaryProps {
  file: File | null;
  type: "extraHours" | "absences";
  getSummary: (file: File) => Promise<ExtraHoursSummary>;
  isProcessing: boolean;
}

export function UploadSummary({ file, type, getSummary, isProcessing }: UploadSummaryProps) {
  const [summary, setSummary] = useState<ExtraHoursSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    async function processFile() {
      if (!file) return;
      
      try {
        setError(null);
        setLoading(true);
        const data = await getSummary(file);
        setSummary(data);
        console.log("Processed summary data:", data);
      } catch (err) {
        console.error("Error in UploadSummary:", err);
        setError("Failed to process file. Please check the format and try again.");
      } finally {
        setLoading(false);
      }
    }
    
    if (file) {
      processFile();
    }
  }, [file, getSummary]);

  if (!file) {
    return <div>No file uploaded</div>;
  }
  
  if (isProcessing || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-monday-blue mb-4" />
        <p className="text-lg font-medium">Processing your file...</p>
        <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 p-4 rounded-md">
        <p className="text-red-800 font-medium">{error}</p>
        <p className="text-sm text-red-600 mt-2">Please check your file format and try again</p>
      </div>
    );
  }
  
  if (!summary || !summary.employeeDetails || summary.employeeDetails.length === 0) {
    return (
      <div className="border border-amber-200 bg-amber-50 p-4 rounded-md">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium">No employee extra hours found in file</p>
            <p className="text-sm text-amber-600 mt-2">
              Your file was processed successfully, but no extra hours were detected. 
              Your file needs to contain hours data in columns named "Hours", "Extra Hours", 
              "ExtraHours" or similar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-md">
        <FileText className="h-6 w-6 text-monday-blue" />
        <div>
          <p className="font-medium">{file.name}</p>
          <p className="text-sm text-muted-foreground">
            {(file.size / 1024).toFixed(2)} KB • Uploaded {formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Total Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-xl font-semibold">{summary.totalExtraHours}</p>
            <p className="text-xs text-muted-foreground">Extra hours recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Records
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-xl font-semibold">{summary.totalEntries}</p>
            <p className="text-xs text-muted-foreground">Entries processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Period
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-sm font-medium">
              {summary.dateRange.from} - {summary.dateRange.to}
            </p>
            <p className="text-xs text-muted-foreground">Date range</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Employees
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-xl font-semibold">{summary.employeeCount}</p>
            <p className="text-xs text-muted-foreground">Staff members</p>
          </CardContent>
        </Card>
      </div>

      {/* Employee breakdown table */}
      {summary.employeeDetails.length > 0 && (
        <div className="border rounded-md mt-4">
          <div className="p-3 border-b bg-muted/40">
            <h3 className="text-sm font-medium">Employee Hours Breakdown</h3>
          </div>
          <div className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Hourly Rate</TableHead>
                  <TableHead className="text-right">Extra Hours</TableHead>
                  <TableHead className="text-right">Entries</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.employeeDetails.map((employee, index) => (
                  <TableRow key={`${employee.employeeId || index}-${employee.rateType || 'standard'}-${index}`}>
                    <TableCell className="font-medium">{employee.employeeName}</TableCell>
                    <TableCell className="text-right">
                      {employee.rateValue ? formatCurrency(roundToTwoDecimals(employee.rateValue) || 0) : 'N/A'}
                      <span className="text-xs text-muted-foreground ml-1">({employee.rateType || 'Standard'})</span>
                    </TableCell>
                    <TableCell className="text-right">{employee.extraHours}</TableCell>
                    <TableCell className="text-right">{employee.entries}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="p-3 bg-green-50 rounded-md text-center text-sm text-green-800">
        File validation complete. Click "Next" to continue with absences upload.
      </div>
    </div>
  );
}
