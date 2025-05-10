
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
      <div className="mb-4">
        <Badge variant="outline" className="text-sm">
          Pay Period: {payPeriod.description}
        </Badge>
      </div>
      
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
