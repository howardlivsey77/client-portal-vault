
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Save } from "lucide-react";

interface EmployeeFormActionsProps {
  isAdmin: boolean;
  readOnly: boolean;
  isEditMode: boolean;
  submitLoading: boolean;
  onCancel: () => void;
  setReadOnly: (readOnly: boolean) => void;
}

export const EmployeeFormActions = ({
  isAdmin,
  readOnly,
  isEditMode,
  submitLoading,
  onCancel,
  setReadOnly
}: EmployeeFormActionsProps) => {
  return (
    <div className="flex justify-end space-x-2">
      <Button 
        variant="outline" 
        type="button"
        onClick={onCancel}
      >
        Cancel
      </Button>
      
      {isAdmin && !readOnly && (
        <Button type="submit" disabled={submitLoading}>
          {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {isEditMode ? "Update Employee" : "Save Employee"}
        </Button>
      )}
      
      {isAdmin && readOnly && isEditMode && (
        <Button 
          type="button" 
          onClick={() => setReadOnly(false)}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      )}
    </div>
  );
};
