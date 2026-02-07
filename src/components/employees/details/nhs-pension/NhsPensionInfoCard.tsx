import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Employee } from "@/types";
import { NhsPensionInfoDisplay } from "./NhsPensionInfoDisplay";
import { NhsPensionInfoForm } from "./NhsPensionInfoForm";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PenLine, HeartPulse } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

interface NhsPensionInfoCardProps {
  employee: Employee;
  updateEmployeeField: (fieldName: string, value: any) => Promise<boolean>;
}

export const NhsPensionInfoCard = ({ employee, updateEmployeeField }: NhsPensionInfoCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { canEditNhsPension } = usePermissions();
  
  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
  };
  
  const handleSubmit = async (values: any) => {
    try {
      if (values.nhs_pension_member !== employee.nhs_pension_member) {
        await updateEmployeeField("nhs_pension_member", values.nhs_pension_member);
      }
      if (values.previous_year_pensionable_pay !== employee.previous_year_pensionable_pay) {
        await updateEmployeeField("previous_year_pensionable_pay", values.previous_year_pensionable_pay);
      }
      if (values.nhs_pension_tier !== employee.nhs_pension_tier) {
        await updateEmployeeField("nhs_pension_tier", values.nhs_pension_tier);
      }
      if (values.nhs_pension_employee_rate !== employee.nhs_pension_employee_rate) {
        await updateEmployeeField("nhs_pension_employee_rate", values.nhs_pension_employee_rate);
      }
      
      setIsEditing(false);
      return true;
    } catch (error) {
      console.error("Error updating NHS pension info:", error);
      return false;
    }
  };
  
  return (
    <Card className="border-[1.5px] border-foreground bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-muted-foreground" /> NHS Pension
        </CardTitle>
        {canEditNhsPension && !isEditing && (
          <Button
            onClick={toggleEditMode}
            variant="outline"
            size="sm"
            className="h-8 gap-1"
          >
            <PenLine className="h-4 w-4" /> Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <NhsPensionInfoForm 
            employee={employee} 
            isEditing={isEditing} 
            toggleEditMode={toggleEditMode}
            onSubmit={handleSubmit}
          />
        ) : (
          <NhsPensionInfoDisplay employee={employee} />
        )}
      </CardContent>
    </Card>
  );
};
