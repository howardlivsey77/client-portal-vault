
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
  formValues: PayrollFormValues;
  onChange: (values: PayrollFormValues) => void;
  payPeriod: PayPeriod;
}

export function PayrollForm({ 
  employee, 
  formValues, 
  onChange, 
  payPeriod 
}: PayrollFormProps) {
  
  const handleInputChange = (field: keyof PayrollFormValues, value: any) => {
    onChange({
      ...formValues,
      [field]: value
    });
  };

  const handleNumberInputChange = (field: keyof PayrollFormValues, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    
    if (!isNaN(numValue)) {
      handleInputChange(field, numValue);
    }
  };

  return (
    <div className="space-y-4">
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
      
      <EmployeeInfoFields 
        employee={employee}
        formValues={formValues}
        onChange={onChange}
        onInputChange={handleInputChange}
      />
      
      <FinancialDetailsFields
        formValues={formValues}
        onInputChange={handleInputChange}
        onNumberInputChange={handleNumberInputChange}
      />
      
      <AdditionalEarningsFields 
        additionalEarnings={formValues.additionalEarnings}
        onEarningsChange={(newEarnings) => handleInputChange('additionalEarnings', newEarnings)}
      />
    </div>
  );
}
