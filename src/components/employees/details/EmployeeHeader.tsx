
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Employee } from "@/hooks/useEmployeeDetails";

interface EmployeeHeaderProps {
  employee: Employee | null;
  isAdmin: boolean;
  deleteEmployee: () => Promise<void>;
}

export const EmployeeHeader = ({ employee, isAdmin, deleteEmployee }: EmployeeHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="mb-6">
      <Button variant="outline" onClick={() => navigate("/employees")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Employees
      </Button>
      
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Employee Details</h1>
        
        {isAdmin && employee && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/employee/edit/${employee.id}`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            
            <Button variant="destructive" onClick={deleteEmployee}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
