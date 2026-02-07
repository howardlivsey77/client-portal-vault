
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Save, X } from "lucide-react";
import { PersonalInfoFormComponent, PersonalInfoFormRef } from "./PersonalInfoForm";
import { PersonalInfoProps, PersonalInfoFormValues } from "./types";
import { usePermissions } from "@/hooks/usePermissions";

interface PersonalInfoCardProps extends PersonalInfoProps {}

export const PersonalInfoCard = ({ employee, updateEmployeeField }: PersonalInfoCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<PersonalInfoFormRef>(null);
  const { canEditEmployee } = usePermissions();

  const toggleEditMode = () => {
    if (isEditing && formRef.current) {
      formRef.current.resetForm();
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    if (formRef.current) {
      formRef.current.submitForm();
    }
  };

  const onSubmit = async (data: PersonalInfoFormValues) => {
    console.log("Form submission data:", data);
    
    try {
      for (const [fieldName, value] of Object.entries(data)) {
        const success = await updateEmployeeField(fieldName, value);
        if (!success) {
          throw new Error(`Failed to update ${fieldName}`);
        }
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating personal information:", error);
    }
  };

  return (
    <Card className="border-[1.5px] border-foreground bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Personal Information</CardTitle>
        {canEditEmployee && (
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
          isEditing={isEditing} 
          toggleEditMode={toggleEditMode} 
          onSubmit={onSubmit}
        />
      </CardContent>
    </Card>
  );
};
