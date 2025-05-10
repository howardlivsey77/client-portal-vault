
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Employee } from "@/types/employee-types";
import { PayrollFormValues } from "./types";
import { EmployeeInfoFields } from "./form/EmployeeInfoFields";
import { FinancialDetailsFields } from "./form/FinancialDetailsFields";
import { AdditionalEarningsFields } from "./form/AdditionalEarningsFields";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface PayrollFormProps {
  employee?: Employee | null;
  formValues?: PayrollFormValues;
  onChange?: (values: PayrollFormValues) => void;
  payPeriod?: PayPeriod;
  onCalculate?: (values: PayrollFormValues) => void;  // Added onCalculate prop
  isCalculating?: boolean;  // Added isCalculating prop
}

export function PayrollForm({ 
  employee, 
  formValues = {} as PayrollFormValues,  // Provide default to avoid undefined errors
  onChange = () => {},  // Provide default to avoid undefined errors
  payPeriod,
  onCalculate,
  isCalculating = false
}: PayrollFormProps) {
  
  const handleInputChange = (field: keyof PayrollFormValues, value: any) => {
    onChange({
      ...formValues,
      [field]: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onCalculate) {
      onCalculate(formValues);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {payPeriod && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                Financial Year: {`${payPeriod.year}/${(payPeriod.year + 1).toString().substring(2)}`}
              </Badge>
              <Badge className="text-sm">
                Pay Period: {payPeriod.description}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
      
      <EmployeeInfoFields 
        employee={employee}
        formValues={formValues}
        onChange={onChange}
        onInputChange={handleInputChange}
      />
      
      <FinancialDetailsFields
        employee={employee}
        formValues={formValues}
        onInputChange={handleInputChange}
      />
      
      <AdditionalEarningsFields 
        additionalEarnings={formValues.additionalEarnings || []}
        onEarningsChange={(newEarnings) => handleInputChange('additionalEarnings', newEarnings)}
      />

      {onCalculate && (
        <div className="flex justify-end">
          <Button type="submit" disabled={isCalculating}>
            {isCalculating ? "Calculating..." : "Calculate Payroll"}
          </Button>
        </div>
      )}
    </form>
  );
}
