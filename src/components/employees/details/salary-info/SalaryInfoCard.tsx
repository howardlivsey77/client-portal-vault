
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, X, Check, DollarSign } from "lucide-react";
import { SalaryInfoFormComponent, SalaryInfoFormRef } from "./SalaryInfoForm";
import { SalaryInfoFormValues, SalaryInfoProps } from "./types";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";

export const SalaryInfoCard = ({ 
  employee, 
  updateEmployeeField,
}: SalaryInfoProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<SalaryInfoFormRef>(null);
  const { canEditSalary } = usePermissions();

  const toggleEditMode = () => {
    if (isEditing) {
      formRef.current?.resetForm();
    }
    setIsEditing(!isEditing);
  };

  const handleSubmit = async (data: SalaryInfoFormValues) => {
    try {
      const updates = [
        { field: 'hours_per_week', value: data.hours_per_week },
        { field: 'hourly_rate', value: data.hourly_rate },
        { field: 'rate_2', value: data.rate_2 },
        { field: 'rate_3', value: data.rate_3 },
        { field: 'rate_4', value: data.rate_4 },
      ];

      for (const update of updates) {
        const success = await updateEmployeeField(update.field, update.value);
        if (!success) {
          toast.error(`Failed to update ${update.field}`);
          return;
        }
      }

      toast.success("Salary details updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating salary details:", error);
      toast.error("Failed to update salary details");
    }
  };

  const handleSave = () => {
    formRef.current?.submitForm();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          Salary Details
        </CardTitle>
        {canEditSalary && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleEditMode}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSave}
                  className="h-8 w-8 p-0 text-primary hover:text-primary/80"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleEditMode}
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <SalaryInfoFormComponent
          ref={formRef}
          employee={employee}
          isEditing={isEditing}
          toggleEditMode={toggleEditMode}
          onSubmit={handleSubmit}
        />
      </CardContent>
    </Card>
  );
};
