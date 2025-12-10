
import { Employee, studentLoanPlanOptions, nicCodeOptions } from "@/types";
import { formatNINumberForDisplay } from "../../NINumberInput";

interface HmrcInfoDisplayProps {
  employee: Employee;
}

export const HmrcInfoDisplay = ({ employee }: HmrcInfoDisplayProps) => {
  const getStudentLoanPlanLabel = (planValue: number | null) => {
    if (planValue === null) return "None";
    const plan = studentLoanPlanOptions.find(p => p.value === planValue);
    return plan ? plan.label : "None";
  };

  const getNicCodeLabel = (codeValue: string | null) => {
    if (!codeValue) return "Not specified";
    const code = nicCodeOptions.find(c => c.value === codeValue);
    return code ? code.label : codeValue;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-sm font-medium mb-2">National Insurance Number</div>
          <div className="p-2.5 bg-muted rounded border border-border">
            {formatNINumberForDisplay(employee.national_insurance_number) || "Not specified"}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">Tax Code</div>
          <div className="p-2.5 bg-muted rounded border border-border">
            {employee.tax_code || "Not specified"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-sm font-medium mb-2">Week One/Month One</div>
          <div className="p-2.5 bg-muted rounded border border-border">
            {employee.week_one_month_one ? "Yes" : "No"}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium mb-2">NIC Code</div>
          <div className="p-2.5 bg-muted rounded border border-border">
            {getNicCodeLabel(employee.nic_code)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-sm font-medium mb-2">Student Loan Plan</div>
          <div className="p-2.5 bg-muted rounded border border-border">
            {getStudentLoanPlanLabel(employee.student_loan_plan)}
          </div>
        </div>
      </div>
    </div>
  );
};
