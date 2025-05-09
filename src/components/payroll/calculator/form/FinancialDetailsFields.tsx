import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/formatters";
import { PayrollFormValues } from "../types";
import { getTaxYear } from "@/utils/taxYearUtils";

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
  const [plainTextValue, setPlainTextValue] = useState<string>(
    formValues.monthlySalary ? formValues.monthlySalary.toString() : ''
  );

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPlainTextValue(value);
    
    // Only update if it's a valid number
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      onNumberInputChange('monthlySalary', value);
    }
  };

  // Calculate annual salary for display
  const annualSalary = formValues.monthlySalary * 12;
  
  // Get the current tax year
  const currentTaxYear = getTaxYear();
  
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Financial Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="monthlySalary" className="flex items-center">
            Monthly Salary
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                    <HelpCircle className="h-3 w-3" />
                    <span className="sr-only">Monthly salary before deductions</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The employee&apos;s gross monthly salary before any deductions.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="monthlySalary"
            value={plainTextValue}
            onChange={handleSalaryChange}
            placeholder="0.00"
            className="mb-1"
          />
          {formValues.monthlySalary > 0 && (
            <p className="text-xs text-muted-foreground">
              Annual: {formatCurrency(annualSalary)}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="taxCode" className="flex items-center">
            Tax Code
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                    <HelpCircle className="h-3 w-3" />
                    <span className="sr-only">UK tax code</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The UK tax code determines the employee&apos;s tax-free allowance.</p>
                  <p>Common codes: 1257L (standard), BR (basic rate), K prefix (reduced allowance)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <div className="flex space-x-2">
            <Input
              id="taxCode"
              value={formValues.taxCode}
              onChange={(e) => onInputChange('taxCode', e.target.value.toUpperCase())}
              placeholder="e.g., 1257L"
              className="flex-grow"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="taxRegion">Tax Region</Label>
          <Select
            value={formValues.taxRegion}
            onValueChange={(value) => onInputChange('taxRegion', value)}
          >
            <SelectTrigger id="taxRegion">
              <SelectValue placeholder="Select tax region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UK">England & Northern Ireland</SelectItem>
              <SelectItem value="Scotland">Scotland</SelectItem>
              <SelectItem value="Wales">Wales</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="pensionPercentage" className="flex items-center">
            Pension Contribution %
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                    <HelpCircle className="h-3 w-3" />
                    <span className="sr-only">Pension contribution percentage</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The percentage of salary contributed to a pension scheme.</p>
                  <p>Pension contributions are deducted from gross pay before tax.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="pensionPercentage"
            type="number"
            min="0"
            max="100"
            value={formValues.pensionPercentage}
            onChange={(e) => onNumberInputChange('pensionPercentage', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="studentLoan">Student Loan Plan</Label>
          <Select
            value={formValues.studentLoanPlan?.toString() || "none"}
            onValueChange={(value) => {
              const planNumber = value !== "none" ? parseInt(value, 10) as 1 | 2 | 4 | 5 : null;
              onInputChange('studentLoanPlan', planNumber);
            }}
          >
            <SelectTrigger id="studentLoan">
              <SelectValue placeholder="No student loan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No student loan</SelectItem>
              <SelectItem value="1">Plan 1</SelectItem>
              <SelectItem value="2">Plan 2</SelectItem>
              <SelectItem value="4">Plan 4 (Scotland)</SelectItem>
              <SelectItem value="5">Plan 5 (Postgraduate)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="nicCode">NI Category</Label>
          <Select
            value={formValues.nicCode || "A"}
            onValueChange={(value) => onInputChange('nicCode', value)}
          >
            <SelectTrigger id="nicCode">
              <SelectValue placeholder="Select NI category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">A - Standard rate</SelectItem>
              <SelectItem value="B">B - Married woman's reduced rate</SelectItem>
              <SelectItem value="C">C - Pension age</SelectItem>
              <SelectItem value="H">H - Apprentice under 25</SelectItem>
              <SelectItem value="J">J - Deferred NI</SelectItem>
              <SelectItem value="M">M - Under 21</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="taxYear">Tax Year</Label>
          <Select
            value={formValues.taxYear || currentTaxYear}
            onValueChange={(value) => onInputChange('taxYear', value)}
          >
            <SelectTrigger id="taxYear">
              <SelectValue placeholder="Select tax year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={currentTaxYear}>{currentTaxYear} (Current)</SelectItem>
              <SelectItem value={(parseInt(currentTaxYear.split('-')[0], 10) - 1) + '-' + currentTaxYear.split('-')[0]}>
                {(parseInt(currentTaxYear.split('-')[0], 10) - 1) + '-' + currentTaxYear.split('-')[0]} (Previous)
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">UK tax year: 6 Apr to 5 Apr</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 mt-4">
        <Checkbox 
          id="useEmergencyTax" 
          checked={formValues.useEmergencyTax}
          onCheckedChange={(checked) => 
            onInputChange('useEmergencyTax', checked === true)
          }
        />
        <Label htmlFor="useEmergencyTax" className="flex items-center">
          Use Emergency Tax Basis (Week 1/Month 1)
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                  <HelpCircle className="h-3 w-3" />
                  <span className="sr-only">Emergency tax information</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="w-80">
                <p>Emergency tax basis treats each pay period separately, without considering previous periods.</p>
                <p>Use for new employees when you don't have their P45 or tax code.</p>
                <p>When checked, YTD calculations won't include previous periods.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
      </div>
      
      <div className="flex items-center space-x-2 mt-2">
        <Checkbox 
          id="isNewEmployee" 
          checked={formValues.isNewEmployee}
          onCheckedChange={(checked) => 
            onInputChange('isNewEmployee', checked === true)
          }
        />
        <Label htmlFor="isNewEmployee">
          First payment in tax year
        </Label>
      </div>
    </div>
  );
}
