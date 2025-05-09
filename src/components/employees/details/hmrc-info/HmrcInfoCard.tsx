
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Employee } from "@/types/employee-types";
import { HmrcInfoDisplay } from "./HmrcInfoDisplay";
import { HmrcInfoForm } from "./HmrcInfoForm";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PenLine, ShieldCheck } from "lucide-react";

interface HmrcInfoCardProps {
  employee: Employee;
  isAdmin: boolean;
  updateEmployeeField: (fieldName: string, value: any) => Promise<boolean>;
}

export const HmrcInfoCard = ({ employee, isAdmin, updateEmployeeField }: HmrcInfoCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
  };
  
  const handleSubmit = async (values: any) => {
    try {
      // Update tax code
      if (values.tax_code !== employee.tax_code) {
        await updateEmployeeField("tax_code", values.tax_code);
      }
      
      // Update week one/month one
      if (values.week_one_month_one !== employee.week_one_month_one) {
        await updateEmployeeField("week_one_month_one", values.week_one_month_one);
      }
      
      // Update NIC code
      if (values.nic_code !== employee.nic_code) {
        await updateEmployeeField("nic_code", values.nic_code);
      }
      
      // Update student loan plan
      if (values.student_loan_plan !== employee.student_loan_plan) {
        await updateEmployeeField("student_loan_plan", values.student_loan_plan);
      }
      
      // Exit edit mode
      setIsEditing(false);
      
      return true;
    } catch (error) {
      console.error("Error updating HMRC info:", error);
      return false;
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" /> HMRC Information
        </CardTitle>
        {isAdmin && !isEditing && (
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
          <HmrcInfoForm 
            employee={employee} 
            isEditing={isEditing} 
            toggleEditMode={toggleEditMode}
            onSubmit={handleSubmit}
          />
        ) : (
          <HmrcInfoDisplay employee={employee} />
        )}
      </CardContent>
    </Card>
  );
};
