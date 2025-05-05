
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const EmployeeNotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h3 className="mt-4 text-xl font-medium">Employee not found</h3>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        The employee record you are looking for does not exist or has been deleted.
      </p>
      <Button onClick={() => navigate("/employees")} className="mt-4">
        Back to Employees
      </Button>
    </div>
  );
};
