
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Employee } from "@/types/employee-types";
import { PayrollFormValues } from "../types";

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
  const [showTaxCodeHelp, setShowTaxCodeHelp] = useState(false);
  
  // Student loan plan options with Plan 6
  const studentLoanOptions = [
    { value: null, label: "None" },
    { value: 1, label: "Plan 1" },
    { value: 2, label: "Plan 2" },
    { value: 4, label: "Plan 4" },
    { value: 5, label: "Plan 5" },
    { value: 6, label: "Plan 6 (Postgraduate)" }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="monthlySalary">Monthly Salary (£)</Label>
          <Input
            id="monthlySalary"
            type="number"
            step="0.01"
            value={formValues.monthlySalary || ''}
            onChange={(e) => onInputChange('monthlySalary', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>
        
        <div>
          <Label htmlFor="taxCode" className="flex justify-between">
            <span>Tax Code</span>
            <button 
              type="button" 
              className="text-xs text-blue-600 hover:underline"
              onClick={() => setShowTaxCodeHelp(!showTaxCodeHelp)}
            >
              {showTaxCodeHelp ? "Hide help" : "What's this?"}
            </button>
          </Label>
          <Input
            id="taxCode"
            value={formValues.taxCode || ''}
            onChange={(e) => onInputChange('taxCode', e.target.value)}
            placeholder="e.g. 1257L"
            readOnly={!!employee && !!employee.tax_code} // Make readonly if employee has tax code
          />
          {showTaxCodeHelp && (
            <div className="mt-1 text-xs text-gray-600">
              <p>UK tax codes determine your Personal Allowance. Common codes:</p>
              <ul className="list-disc list-inside mt-1">
                <li>1257L - Standard Personal Allowance (£12,570)</li>
                <li>BR - All income taxed at basic rate (20%)</li>
                <li>NT - No tax to be deducted</li>
                <li>K codes - Reduce your tax-free amount</li>
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="pensionPercentage">Pension Contribution (%)</Label>
          <Input
            id="pensionPercentage"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formValues.pensionPercentage || ''}
            onChange={(e) => onInputChange('pensionPercentage', parseFloat(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
        
        <div>
          <Label htmlFor="studentLoanPlan">Student Loan Plan</Label>
          <Select
            value={formValues.studentLoanPlan !== null ? String(formValues.studentLoanPlan) : "null"}
            onValueChange={(value) => {
              const planValue = value === "null" ? null : parseInt(value);
              onInputChange('studentLoanPlan', planValue);
            }}
          >
            <SelectTrigger id="studentLoanPlan">
              <SelectValue placeholder="Select plan" />
            </SelectTrigger>
            <SelectContent>
              {studentLoanOptions.map((option) => (
                <SelectItem 
                  key={option.value === null ? 'null' : option.value} 
                  value={option.value === null ? 'null' : String(option.value)}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
