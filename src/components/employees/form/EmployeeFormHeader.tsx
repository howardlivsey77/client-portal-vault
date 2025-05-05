
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EmployeeFormHeaderProps {
  isEditMode: boolean;
  readOnly: boolean;
}

export const EmployeeFormHeader = ({ isEditMode, readOnly }: EmployeeFormHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="mb-6">
      <Button variant="outline" onClick={() => navigate("/employees")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Employees
      </Button>
      <h1 className="text-3xl font-bold">
        {isEditMode 
          ? (readOnly ? "View Employee" : "Edit Employee") 
          : "Add New Employee"}
      </h1>
    </div>
  );
};
