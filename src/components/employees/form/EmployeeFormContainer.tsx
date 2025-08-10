
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { PersonalInfoFields } from "@/components/employees/PersonalInfoFields";
import { JobInfoFields } from "@/components/employees/JobInfoFields";
import { CompensationFields } from "@/components/employees/CompensationFields";
import { ContactFields } from "@/components/employees/ContactFields";
import { AddressFields } from "@/components/employees/AddressFields";
import { HireDateField } from "@/components/employees/HireDateField";
import { PayrollIdField } from "@/components/employees/PayrollIdField";
import { EmployeeFormActions } from "@/components/employees/EmployeeFormActions";
import { HmrcFields } from "@/components/employees/HmrcFields";
import { NhsPensionFields } from "@/components/employees/NhsPensionFields";
import { UseFormReturn } from "react-hook-form";
import { EmployeeFormValues } from "@/types/employee";
import { useNavigate } from "react-router-dom";

interface EmployeeFormContainerProps {
  form: UseFormReturn<EmployeeFormValues>;
  isAdmin: boolean;
  isEditMode: boolean;
  readOnly: boolean;
  submitLoading: boolean;
  employeeId?: string;
  onSubmit: (data: EmployeeFormValues) => Promise<void>;
  setReadOnly: (readOnly: boolean) => void;
}

export const EmployeeFormContainer = ({ 
  form, 
  isAdmin, 
  isEditMode, 
  readOnly, 
  submitLoading,
  employeeId,
  onSubmit,
  setReadOnly
}: EmployeeFormContainerProps) => {
  const navigate = useNavigate();
  
  return (
    <Card className="border-[1.5px] border-foreground">
      <CardHeader>
        <CardTitle>
          {isEditMode 
            ? (readOnly ? "View Employee Information" : "Edit Employee Information") 
            : "New Employee Information"}
        </CardTitle>
        <CardDescription>
          {readOnly 
            ? "View employee details below." 
            : "Enter the employee details below. Required fields are marked with an asterisk (*)."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            <PersonalInfoFields form={form} readOnly={readOnly} />
            
            {/* Job Information */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <JobInfoFields form={form} readOnly={readOnly} />
              <HireDateField form={form} readOnly={readOnly} />
            </div>

            {/* Payroll ID */}
            <div className="max-w-xs">
              <PayrollIdField form={form} readOnly={readOnly} />
            </div>
            
            {/* HMRC Section */}
            <HmrcFields control={form.control} readOnly={readOnly} />
            
            {/* NHS Pension Section */}
            <NhsPensionFields control={form.control} readOnly={readOnly} />
            
            {/* Compensation Information */}
            <CompensationFields 
              form={form} 
              readOnly={readOnly}
              employeeId={employeeId !== "new" ? employeeId : undefined}
              isNew={!isEditMode}
            />
            
            {/* Contact Information */}
            <ContactFields form={form} readOnly={readOnly} />
            
            {/* Address Information */}
            <AddressFields form={form} readOnly={readOnly} />
          </CardContent>
          
          <CardFooter>
            <EmployeeFormActions 
              isAdmin={isAdmin}
              readOnly={readOnly}
              isEditMode={isEditMode}
              submitLoading={submitLoading}
              onCancel={() => navigate("/employees")}
              setReadOnly={setReadOnly}
            />
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
