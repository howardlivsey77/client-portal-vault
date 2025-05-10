
import { useState } from 'react';
import { Employee } from "@/types/employee-types";
import { PayrollFormValues } from "./types";
import { EmployeeInfoFields } from "./form/EmployeeInfoFields";
import { FinancialDetailsFields } from "./form/FinancialDetailsFields";
import { AdditionalEarningsFields } from "./form/AdditionalEarningsFields";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";
import { PayrollFormCard } from "./form/PayrollFormCard";
import { PayrollFormSubmit } from "./form/PayrollFormSubmit";

interface PayrollFormProps {
  employee?: Employee | null;
  formValues?: PayrollFormValues;
  onChange?: (values: PayrollFormValues) => void;
  payPeriod?: PayPeriod;
  onCalculate?: (values: PayrollFormValues) => void;
  isCalculating?: boolean;
}

export function PayrollForm({ 
  employee, 
  formValues = {} as PayrollFormValues,
  onChange = () => {},
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
      <PayrollFormCard payPeriod={payPeriod}>
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

        <PayrollFormSubmit 
          onCalculate={onCalculate ? () => {} : undefined}
          isCalculating={isCalculating}
        />
      </PayrollFormCard>
    </form>
  );
}
