import { useCallback, useRef } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHMRCImport } from "@/hooks/employees/import/useHMRCImport";

interface HMRCXmlImportProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const HMRCXmlImport = ({ onSuccess, onCancel }: HMRCXmlImportProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    loading,
    parsing,
    parseResult,
    existingEmployeesCount,
    error,
    processFile,
    executeImport,
    reset
  } = useHMRCImport();

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.xml')) {
      return;
    }

    await processFile(file);
    
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFile]);

  const handleImport = useCallback(async () => {
    const success = await executeImport();
    if (success) {
      onSuccess();
    }
  }, [executeImport, onSuccess]);

  const handleReset = useCallback(() => {
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [reset]);

  const hasExistingEmployees = existingEmployeesCount !== null && existingEmployeesCount > 0;

  return (
    <div className="space-y-4">
      {/* File Upload Area */}
      {!parseResult && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml"
              onChange={handleFileSelect}
              className="hidden"
              id="hmrc-xml-upload"
            />
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload HMRC FPS XML File</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Select an HMRC Full Payment Submission (FPS) XML file to import employee data
            </p>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={parsing}
            >
              {parsing ? "Processing..." : "Select File"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Warning for existing employees */}
      {hasExistingEmployees && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Company Has Existing Employees</AlertTitle>
          <AlertDescription>
            This company already has {existingEmployeesCount} employee(s). 
            This import feature is intended for initial setup only. 
            Importing may create duplicate records.
          </AlertDescription>
        </Alert>
      )}

      {/* Parse Results */}
      {parseResult && parseResult.employees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              File Parsed Successfully
            </CardTitle>
            <CardDescription>
              Found {parseResult.employees.length} employees to import
              {parseResult.taxYear && ` (Tax Year: ${parseResult.taxYear})`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Employee Preview Table */}
            <div className="border rounded-md">
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payroll ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>NI Number</TableHead>
                      <TableHead>Tax Code</TableHead>
                      <TableHead>Postcode</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parseResult.employees.map((emp, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono">{emp.payroll_id || "-"}</TableCell>
                        <TableCell>{emp.first_name} {emp.last_name}</TableCell>
                        <TableCell className="font-mono">{emp.national_insurance_number || "-"}</TableCell>
                        <TableCell className="font-mono">{emp.tax_code || "-"}</TableCell>
                        <TableCell>{emp.postcode || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            {/* Summary */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{parseResult.employees.length} employees will be created</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={parseResult ? handleReset : onCancel}>
          {parseResult ? "Choose Different File" : "Cancel"}
        </Button>
        {parseResult && parseResult.employees.length > 0 && (
          <Button 
            onClick={handleImport} 
            disabled={loading || hasExistingEmployees}
          >
            {loading ? "Importing..." : `Import ${parseResult.employees.length} Employees`}
          </Button>
        )}
      </div>
    </div>
  );
};
