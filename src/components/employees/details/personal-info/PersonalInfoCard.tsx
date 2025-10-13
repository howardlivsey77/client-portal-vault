
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Save, X } from "lucide-react";
import { PersonalInfoFormComponent, PersonalInfoFormRef } from "./PersonalInfoForm";
import { PersonalInfoProps, PersonalInfoFormValues } from "./types";

interface PersonalInfoCardProps extends PersonalInfoProps {}

export const PersonalInfoCard = ({ employee, isAdmin, updateEmployeeField, canEdit = false }: PersonalInfoCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<PersonalInfoFormRef>(null);

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

  const onSubmit = async (data: PersonalInfoFormValues) => {
    console.log("Form submission data:", data);
    
    try {
      // Update each field individually using the existing updateEmployeeField function
      // which already handles loading states and toast notifications
      for (const [fieldName, value] of Object.entries(data)) {
        const success = await updateEmployeeField(fieldName, value);
        if (!success) {
          throw new Error(`Failed to update ${fieldName}`);
        }
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating personal information:", error);
      // updateEmployeeField already shows error toasts, so we don't need to duplicate them
    }
  };

  return (
    <Card className="border-[1.5px] border-foreground bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Personal Information</CardTitle>
        {canEdit && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={toggleEditMode}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                >
                  <Save className="h-4 w-4" />
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
