
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface SalaryFieldProps {
  monthlySalary: number;
  onNumberInputChange: (field: string, value: string) => void;
}

export function SalaryField({ monthlySalary, onNumberInputChange }: SalaryFieldProps) {
  const [plainTextValue, setPlainTextValue] = useState<string>(
    monthlySalary ? monthlySalary.toString() : ''
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
  const annualSalary = monthlySalary * 12;
  
  return (
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
      {monthlySalary > 0 && (
        <p className="text-xs text-muted-foreground">
          Annual: {formatCurrency(annualSalary)}
        </p>
      )}
    </div>
  );
}
