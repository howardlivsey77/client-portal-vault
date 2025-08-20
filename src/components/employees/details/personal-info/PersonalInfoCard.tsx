
import { useState, useRef } from "react";
import { Employee } from "@/types/employeeDetails";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Save, Loader2, X } from "lucide-react";
import { PersonalInfoFormComponent, PersonalInfoFormRef } from "./PersonalInfoForm";
import { PersonalInfoFormValues } from "./types";
import { useToast } from "@/hooks/use-toast";

interface PersonalInfoCardProps {
  employee: Employee;
  isAdmin: boolean;
  updateEmployeeField: (fieldName: string, value: any) => Promise<boolean>;
}

export const PersonalInfoCard = ({ employee, isAdmin, updateEmployeeField }: PersonalInfoCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const formRef = useRef<PersonalInfoFormRef>(null);
  const { toast } = useToast();

  // Handle edit mode toggle
  const toggleEditMode = () => {
    if (isEditing && formRef.current) {
      // Reset form when canceling edit
      formRef.current.resetForm();
    }
    setIsEditing(!isEditing);
  };

  // Handle save button click
  const handleSave = () => {
    if (formRef.current) {
      formRef.current.submitForm();
    }
  };

  // Handle form submission
  const onSubmit = async (data: PersonalInfoFormValues) => {
    setIsSaving(true);
    try {
      const fieldsToUpdate: Record<string, any> = {
        first_name: data.first_name,
        last_name: data.last_name,
        department: data.department,
        gender: data.gender,
        payroll_id: data.payroll_id,
        date_of_birth: data.date_of_birth ? data.date_of_birth.toISOString() : null,
        hours_per_week: data.hours_per_week,
        hourly_rate: data.hourly_rate,
        rate_2: data.rate_2,
        rate_3: data.rate_3,
        rate_4: data.rate_4,
      };

      // Update fields one by one
      let hasError = false;
      for (const [field, value] of Object.entries(fieldsToUpdate)) {
        const success = await updateEmployeeField(field, value);
        if (!success) {
          hasError = true;
          break;
        }
      }

      if (!hasError) {
        toast({
          title: "Success",
          description: "Personal information updated successfully",
        });
        // Exit edit mode only on successful save
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      toast({
        title: "Error",
        description: "Failed to update personal information",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-[1.5px] border-foreground bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Personal Information</CardTitle>
        {isAdmin && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={toggleEditMode}
                  disabled={isSaving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                onClick={toggleEditMode}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <PersonalInfoFormComponent 
          ref={formRef}
          employee={employee} 
          isAdmin={isAdmin} 
          updateEmployeeField={updateEmployeeField} 
          isEditing={isEditing} 
          toggleEditMode={toggleEditMode} 
          onSubmit={onSubmit}
        />
      </CardContent>
    </Card>
  );
};
