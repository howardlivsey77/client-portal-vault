import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmployeeImport } from "./EmployeeImport";

interface ImportEmployeeDialogControlledProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ImportEmployeeDialogControlled = ({
  open,
  onOpenChange,
  onSuccess
}: ImportEmployeeDialogControlledProps) => {
  
  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess();
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-slate-50 py-[16px] px-[3px] mx-0">
        <DialogHeader>
          <DialogTitle>Import Employees</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import multiple employees at once. Each employee will be created with the provided details and will need to be invited separately via the user management system.
          </DialogDescription>
        </DialogHeader>
        <EmployeeImport 
          onSuccess={handleSuccess} 
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};