
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PayrollFormValues } from "../types";

interface FinancialDetailsFieldsProps {
  formValues: PayrollFormValues;
  onInputChange: (field: keyof PayrollFormValues, value: any) => void;
  onNumberInputChange: (field: keyof PayrollFormValues, value: string) => void;
}

export function FinancialDetailsFields({ 
  formValues, 
  onInputChange, 
  onNumberInputChange 
}: FinancialDetailsFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="monthlySalary">Monthly Salary (£)</Label>
          <Input 
            id="monthlySalary" 
            type="number"
            value={formValues.monthlySalary || ''} 
            onChange={(e) => onNumberInputChange('monthlySalary', e.target.value)} 
            placeholder="0.00"
          />
        </div>
        <div>
          <Label htmlFor="taxCode">Tax Code</Label>
          <Input 
            id="taxCode" 
            value={formValues.taxCode} 
            onChange={(e) => onInputChange('taxCode', e.target.value)} 
            placeholder="1257L"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="taxRegion">Tax Region</Label>
          <Select 
            onValueChange={(value) => onInputChange('taxRegion', value)} 
            value={formValues.taxRegion || 'UK'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Tax Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UK">UK / England</SelectItem>
              <SelectItem value="Scotland">Scotland</SelectItem>
              <SelectItem value="Wales">Wales</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="pensionPercentage">Pension Contribution (%)</Label>
          <Input 
            id="pensionPercentage" 
            type="number"
            value={formValues.pensionPercentage || ''} 
            onChange={(e) => onNumberInputChange('pensionPercentage', e.target.value)} 
            placeholder="0.00"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="studentLoanPlan">Student Loan Plan</Label>
        <Select 
          onValueChange={(value) => {
            const planValue = value === "none" ? null : parseInt(value);
            onInputChange('studentLoanPlan', planValue);
          }} 
          value={formValues.studentLoanPlan?.toString() || "none"}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Student Loan</SelectItem>
            <SelectItem value="1">Plan 1</SelectItem>
            <SelectItem value="2">Plan 2</SelectItem>
            <SelectItem value="4">Plan 4</SelectItem>
            <SelectItem value="5">Plan 5</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
