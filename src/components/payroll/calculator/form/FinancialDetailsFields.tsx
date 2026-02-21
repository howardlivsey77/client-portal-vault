import { Employee } from "@/types";
import { PayrollFormValues } from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaxCodeInput } from "@/components/employees/TaxCodeInput";

interface FinancialDetailsFieldsProps {
  employee?: Employee | null;
  formValues: PayrollFormValues;
  onInputChange: (field: keyof PayrollFormValues, value: any) => void;
}

export function FinancialDetailsFields({ 
  employee, 
  formValues, 
  onInputChange 
}: FinancialDetailsFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="monthlySalary">Monthly Salary (£)</Label>
            <Input
              id="monthlySalary"
              type="number"
              step="0.01"
              value={formValues.monthlySalary || employee?.monthly_salary || 0}
              onChange={(e) => onInputChange('monthlySalary', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxCode">Tax Code</Label>
            <TaxCodeInput
              value={formValues.taxCode || employee?.tax_code || '1257L'}
              onChange={(value) => onInputChange('taxCode', value)}
              placeholder="1257L"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pensionPercentage">Pension Percentage (%)</Label>
            <Input
              id="pensionPercentage"
              type="number"
              step="0.1"
              value={formValues.pensionPercentage || 0}
              onChange={(e) => onInputChange('pensionPercentage', parseFloat(e.target.value) || 0)}
              placeholder="0.0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentLoanPlan">Student Loan Plan</Label>
            <Select 
              value={formValues.studentLoanPlan?.toString() || employee?.student_loan_plan?.toString() || "none"}
              onValueChange={(value) => onInputChange('studentLoanPlan', value === "none" ? null : value === "PGL" ? "PGL" : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Student Loan</SelectItem>
                <SelectItem value="1">Plan 1</SelectItem>
                <SelectItem value="2">Plan 2</SelectItem>
                <SelectItem value="4">Plan 4</SelectItem>
                <SelectItem value="PGL">Postgraduate Loan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* NHS Pension Section */}
        <div className="border-t pt-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isNHSPensionMember"
                checked={formValues.isNHSPensionMember || employee?.nhs_pension_member || false}
                onCheckedChange={(checked) => onInputChange('isNHSPensionMember', checked)}
              />
              <Label htmlFor="isNHSPensionMember" className="text-sm font-medium">
                NHS Pension Scheme Member
              </Label>
            </div>

            {(formValues.isNHSPensionMember || employee?.nhs_pension_member) && (
              <div className="space-y-2">
                <Label htmlFor="previousYearPensionablePay">
                  Previous Year Pensionable Pay (£)
                  <span className="text-sm text-gray-500 ml-1">
                    (Optional - if not provided, current annual salary will be used for tier calculation)
                  </span>
                </Label>
                <Input
                  id="previousYearPensionablePay"
                  type="number"
                  step="0.01"
                  value={formValues.previousYearPensionablePay ?? employee?.previous_year_pensionable_pay ?? ""}
                  onChange={(e) => onInputChange('previousYearPensionablePay', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Enter previous year's pensionable pay"
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
