
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HelpCircle, Download } from "lucide-react";
import * as XLSX from "xlsx";

export const WorkPatternImportGuide = () => {
  const handleDownloadTemplate = () => {
    // Create a simple template workbook
    const workbook = XLSX.utils.book_new();
    
    // Define the headers with required and work pattern columns
    const headers = [
      "First Name", "Last Name", "Department", 
      "Monday Working", "Monday Start Time", "Monday End Time",
      "Tuesday Working", "Tuesday Start Time", "Tuesday End Time",
      "Wednesday Working", "Wednesday Start Time", "Wednesday End Time",
      "Thursday Working", "Thursday Start Time", "Thursday End Time",
      "Friday Working", "Friday Start Time", "Friday End Time",
      "Saturday Working", "Saturday Start Time", "Saturday End Time", 
      "Sunday Working", "Sunday Start Time", "Sunday End Time",
      "Email", "Hours Per Week", "Hourly Rate"
    ];
    
    // Example data (two rows)
    const data = [
      // Row 1: Standard Monday-Friday employee
      {
        "First Name": "John", 
        "Last Name": "Smith",
        "Department": "Engineering",
        "Monday Working": true,
        "Monday Start Time": "09:00",
        "Monday End Time": "17:00",
        "Tuesday Working": true,
        "Tuesday Start Time": "09:00",
        "Tuesday End Time": "17:00",
        "Wednesday Working": true,
        "Wednesday Start Time": "09:00",
        "Wednesday End Time": "17:00",
        "Thursday Working": true,
        "Thursday Start Time": "09:00",
        "Thursday End Time": "17:00",
        "Friday Working": true,
        "Friday Start Time": "09:00",
        "Friday End Time": "17:00",
        "Saturday Working": false,
        "Saturday Start Time": "",
        "Saturday End Time": "",
        "Sunday Working": false,
        "Sunday Start Time": "",
        "Sunday End Time": "",
        "Email": "john.smith@example.com",
        "Hours Per Week": 40,
        "Hourly Rate": 25
      },
      // Row 2: Part-time employee with weekend hours
      {
        "First Name": "Jane", 
        "Last Name": "Doe",
        "Department": "Sales",
        "Monday Working": false,
        "Monday Start Time": "",
        "Monday End Time": "",
        "Tuesday Working": true,
        "Tuesday Start Time": "10:00",
        "Tuesday End Time": "14:00",
        "Wednesday Working": true,
        "Wednesday Start Time": "10:00",
        "Wednesday End Time": "14:00",
        "Thursday Working": true,
        "Thursday Start Time": "10:00",
        "Thursday End Time": "14:00",
        "Friday Working": false,
        "Friday Start Time": "",
        "Friday End Time": "",
        "Saturday Working": true,
        "Saturday Start Time": "09:00",
        "Saturday End Time": "17:00",
        "Sunday Working": false,
        "Sunday Start Time": "",
        "Sunday End Time": "",
        "Email": "jane.doe@example.com",
        "Hours Per Week": 20,
        "Hourly Rate": 22
      }
    ];
    
    // Create worksheet with headers and data
    const ws = XLSX.utils.json_to_sheet(data, { header: headers });
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, ws, "Employee Import Template");
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, "employee_import_template.xlsx");
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <HelpCircle className="h-4 w-4" />
          Work Pattern Import Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Work Pattern Import Guide</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p>
            To import employee work patterns, your spreadsheet should include columns for each day of the week 
            with information about whether the employee works that day and their start/end times.
          </p>
          
          <h3 className="text-lg font-medium">Required Column Format</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Column Name Examples</TableHead>
                <TableHead>Expected Values</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Working Status</TableCell>
                <TableCell>
                  "Monday Working", "Tuesday", "Wednesday Working", etc.
                </TableCell>
                <TableCell>
                  <code>true</code>/<code>false</code>, <code>yes</code>/<code>no</code>, <code>1</code>/<code>0</code>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Start Time</TableCell>
                <TableCell>
                  "Monday Start Time", "Monday Start", "Tue Start", etc.
                </TableCell>
                <TableCell>
                  Time in 24-hour format (e.g., "09:00", "13:30")
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">End Time</TableCell>
                <TableCell>
                  "Monday End Time", "Monday End", "Tue End", etc.
                </TableCell>
                <TableCell>
                  Time in 24-hour format (e.g., "17:00", "21:45")
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          <h3 className="text-lg font-medium">Example</h3>
          <p>For each day of the week, add three columns:</p>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Monday Working</TableHead>
                <TableHead>Monday Start Time</TableHead>
                <TableHead>Monday End Time</TableHead>
                <TableHead>Tuesday Working</TableHead>
                <TableHead>Tuesday Start Time</TableHead>
                <TableHead>Tuesday End Time</TableHead>
                <TableHead>...</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>true</TableCell>
                <TableCell>09:00</TableCell>
                <TableCell>17:00</TableCell>
                <TableCell>true</TableCell>
                <TableCell>09:00</TableCell>
                <TableCell>17:00</TableCell>
                <TableCell>...</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>yes</TableCell>
                <TableCell>08:30</TableCell>
                <TableCell>16:30</TableCell>
                <TableCell>no</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell>...</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          <div className="flex justify-center my-6">
            <Button onClick={handleDownloadTemplate} className="gap-2">
              <Download className="h-4 w-4" />
              Download Import Template
            </Button>
          </div>
          
          <h3 className="text-lg font-medium">Notes</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Time should be in 24-hour format (09:00, not 9:00 AM)</li>
            <li>Times are automatically rounded to 15-minute intervals</li>
            <li>If a day is marked as not working, the start/end times are ignored</li>
            <li>If no working status is provided but start/end times exist, the day is assumed to be a working day</li>
            <li>If no work pattern data is provided, a default pattern will be used (Mon-Fri, 9-5)</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};
