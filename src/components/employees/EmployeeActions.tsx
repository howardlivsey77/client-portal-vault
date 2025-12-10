import { Button } from "@/components/ui/button";
import { Plus, Upload, ChevronDown, FileText } from "lucide-react";
import { ImportEmployeeDialogControlled } from "./ImportEmployeeDialogControlled";
import { HMRCImportDialog } from "./HMRCImportDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface EmployeeActionsProps {
  isAdmin: boolean;
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export const EmployeeActions = ({ isAdmin, loading, onRefresh }: EmployeeActionsProps) => {
  const navigate = useNavigate();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [hmrcImportDialogOpen, setHmrcImportDialogOpen] = useState(false);

  return (
    <>
      {isAdmin && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate("/employee/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Single Employee
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import from CSV/Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHmrcImportDialogOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Import from HMRC XML
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <ImportEmployeeDialogControlled 
            open={importDialogOpen}
            onOpenChange={setImportDialogOpen}
            onSuccess={onRefresh} 
          />
          
          <HMRCImportDialog
            open={hmrcImportDialogOpen}
            onOpenChange={setHmrcImportDialogOpen}
            onSuccess={onRefresh}
          />
        </>
      )}
    </>
  );
};
