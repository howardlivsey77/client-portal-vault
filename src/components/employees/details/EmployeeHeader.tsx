
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowLeftCircle, ArrowRightCircle, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Employee } from "@/types/employeeDetails";

interface EmployeeHeaderProps {
  employee: Employee | null;
  isAdmin: boolean;
  nextEmployeeId: string | null;
  prevEmployeeId: string | null;
  navigateToEmployee: (id: string | null) => void;
  deleteEmployee: () => Promise<void>;
}

export const EmployeeHeader = ({ 
  employee, 
  isAdmin, 
  nextEmployeeId,
  prevEmployeeId,
  navigateToEmployee,
  deleteEmployee 
}: EmployeeHeaderProps) => {
  const navigate = useNavigate();
  
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
