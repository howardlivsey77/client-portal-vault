
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EmptyEmployeeStateProps {
  isAdmin: boolean;
  searchTerm: string;
}

export const EmptyEmployeeState = ({ isAdmin, searchTerm }: EmptyEmployeeStateProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Users className="h-16 w-16 text-muted-foreground/50" />
      <h3 className="mt-4 text-xl font-medium">No employees found</h3>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {searchTerm ? "No employees match your search criteria." : "No employees have been added yet."}
      </p>
      {!searchTerm && isAdmin && (
        <Button onClick={() => navigate("/employee/new")} className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      )}
    </div>
  );
};
