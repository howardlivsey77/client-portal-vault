
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmployeeData } from "./ImportConstants";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EmployeeChangesConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  newEmployees: EmployeeData[];
  updatedEmployees: {
    existing: EmployeeData;
    imported: EmployeeData;
  }[];
}

export const EmployeeChangesConfirmation = ({
  isOpen,
  onClose,
  onConfirm,
  newEmployees,
  updatedEmployees
}: EmployeeChangesConfirmationProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-4xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Employee Import</AlertDialogTitle>
          <AlertDialogDescription>
            Please review the changes below before confirming the import.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <ScrollArea className="h-[60vh]">
          <div className="space-y-6 py-2">
            {newEmployees.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">
                  New Employees ({newEmployees.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {newEmployees.map((emp, i) => (
                      <TableRow key={`new-${i}`}>
                        <TableCell>
                          {emp.first_name} {emp.last_name}
                          <Badge variant="outline" className="ml-2">New</Badge>
                        </TableCell>
                        <TableCell>{emp.department}</TableCell>
                        <TableCell>{emp.email || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {updatedEmployees.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">
                  Updated Employees ({updatedEmployees.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Current Value</TableHead>
                      <TableHead>New Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {updatedEmployees.flatMap((empPair, i) => {
                      const changes: { field: string; oldValue: any; newValue: any }[] = [];
                      
                      // Compare all fields and list changes
                      Object.keys(empPair.imported).forEach(key => {
                        if (key !== 'id' && empPair.existing[key] !== empPair.imported[key] && empPair.imported[key]) {
                          changes.push({
                            field: key,
                            oldValue: empPair.existing[key],
                            newValue: empPair.imported[key]
                          });
                        }
                      });
                      
                      return changes.map((change, j) => (
                        <TableRow key={`change-${i}-${j}`}>
                          {j === 0 ? (
                            <TableCell rowSpan={changes.length}>
                              {empPair.existing.first_name} {empPair.existing.last_name}
                              <Badge variant="secondary" className="ml-2">Update</Badge>
                            </TableCell>
                          ) : null}
                          <TableCell>{change.field.replace(/_/g, ' ')}</TableCell>
                          <TableCell>{change.oldValue || "-"}</TableCell>
                          <TableCell className="font-medium">{change.newValue}</TableCell>
                        </TableRow>
                      ));
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {newEmployees.length === 0 && updatedEmployees.length === 0 && (
              <div className="text-center py-6">
                <p>No changes detected. All employees are already up to date.</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Confirm Import
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
