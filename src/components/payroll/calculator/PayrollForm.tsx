
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Employee } from "@/types/employee-types";
import { PayrollFormValues } from "./types";
import { EmployeeInfoFields } from "./form/EmployeeInfoFields";
import { FinancialDetailsFields } from "./form/FinancialDetailsFields";
import { AdditionalEarningsFields } from "./form/AdditionalEarningsFields";

interface PayrollFormProps {
  employee?: Employee | null;
  formValues: PayrollFormValues;
  onChange: (values: PayrollFormValues) => void;
  payPeriod: string;
  onPayPeriodChange: (value: string) => void;
}

export function PayrollForm({ 
  employee, 
  formValues, 
  onChange, 
  payPeriod,
  onPayPeriodChange 
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
      
      <div>
        <Label htmlFor="payPeriod">Pay Period</Label>
        <Input 
          id="payPeriod" 
          value={payPeriod} 
          onChange={(e) => onPayPeriodChange(e.target.value)} 
          placeholder="May 2025"
        />
      </div>
    </div>
  );
}
