
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowLeftCircle, ArrowRightCircle, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Employee } from "@/types";
import { usePermissions } from "@/hooks/usePermissions";
import { useConfirmation } from "@/hooks/useConfirmation";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

interface EmployeeHeaderProps {
  employee: Employee | null;
  nextEmployeeId: string | null;
  prevEmployeeId: string | null;
  navigateToEmployee: (id: string | null) => void;
  deleteEmployee: () => Promise<void>;
}

export const EmployeeHeader = ({ 
  employee, 
  nextEmployeeId,
  prevEmployeeId,
  navigateToEmployee,
  deleteEmployee 
}: EmployeeHeaderProps) => {
  const navigate = useNavigate();
  const { canDeleteEmployee, canEditEmployee } = usePermissions();
  const { confirm, confirmationProps } = useConfirmation();

  const handleDelete = () => {
    confirm({
      title: "Delete employee?",
      description: "This action cannot be undone. The employee record and all associated data will be permanently removed.",
      variant: "destructive",
      onConfirm: deleteEmployee,
    });
  };
  
  return (
    <div className="mb-6">
      <div className="flex justify-between mb-4">
        <Button variant="outline" onClick={() => navigate("/employees")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employees
        </Button>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            disabled={!prevEmployeeId} 
            onClick={() => navigateToEmployee(prevEmployeeId)}
            title="Previous Employee"
          >
            <ArrowLeftCircle className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            disabled={!nextEmployeeId} 
            onClick={() => navigateToEmployee(nextEmployeeId)}
            title="Next Employee"
          >
            <ArrowRightCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Employee Details</h1>
        
        {canEditEmployee && employee && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/employee/edit/${employee.id}`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            
            {canDeleteEmployee && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      <ConfirmationDialog {...confirmationProps} />
    </div>
  );
};
