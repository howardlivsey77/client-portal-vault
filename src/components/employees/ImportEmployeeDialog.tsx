
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmployeeImport } from "./EmployeeImport";
import { Plus, FileSpreadsheet } from "lucide-react";
import { useState } from "react";

interface ImportEmployeeDialogProps {
  onSuccess: () => void;
}

export const ImportEmployeeDialog = ({ onSuccess }: ImportEmployeeDialogProps) => {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Employees</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center p-4 border-2 border-dashed rounded-lg bg-muted/50">
            <div className="text-center">
              <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Import from Excel or CSV</p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload a spreadsheet with employee data
              </p>
            </div>
          </div>
          <EmployeeImport onSuccess={handleSuccess} onCancel={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
