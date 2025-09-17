
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus, Upload, ChevronDown } from "lucide-react";
import { ImportEmployeeDialogControlled } from "./ImportEmployeeDialogControlled";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
              <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import from File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <ImportEmployeeDialogControlled 
            open={importDialogOpen}
            onOpenChange={setImportDialogOpen}
            onSuccess={onRefresh} 
          />
        </>
      )}
    </>
  );
};
