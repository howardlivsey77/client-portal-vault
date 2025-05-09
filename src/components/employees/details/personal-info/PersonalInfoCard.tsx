
import { useState } from "react";
import { Employee } from "@/types/employeeDetails";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Save } from "lucide-react";
import { PersonalInfoFormComponent } from "./PersonalInfoForm";
import { PersonalInfoFormValues } from "./types";

interface PersonalInfoCardProps {
  employee: Employee;
  isAdmin: boolean;
  updateEmployeeField: (fieldName: string, value: any) => Promise<boolean>;
}

export const PersonalInfoCard = ({ employee, isAdmin, updateEmployeeField }: PersonalInfoCardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  // Handle edit mode toggle
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  // Handle save
  const onSubmit = async (data: PersonalInfoFormValues) => {
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
    for (const [field, value] of Object.entries(fieldsToUpdate)) {
      await updateEmployeeField(field, value);
    }

    // Exit edit mode
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Personal Information</CardTitle>
        {isAdmin && (
          <div>
            {isEditing ? (
              <Button 
                type="button" 
                onClick={() => document.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))}
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
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
