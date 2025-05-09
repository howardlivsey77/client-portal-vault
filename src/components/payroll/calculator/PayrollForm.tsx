
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Employee } from "@/hooks/useEmployees";
import { PayrollFormValues } from "./types";

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
  
  useEffect(() => {
    if (employee) {
      const hourlyRate = employee.hourly_rate || 0;
      const hoursPerWeek = employee.hours_per_week || 0;
      
      // Calculate monthly salary based on hourly rate and weekly hours
      // We use 4.33 as the average number of weeks per month (52/12)
      const monthlySalary = Number((hourlyRate * hoursPerWeek * 4.33).toFixed(2));

      onChange({
        ...formValues,
        employeeId: employee.id,
        employeeName: `${employee.first_name} ${employee.last_name}`,
        payrollId: employee.payroll_id || '',
        monthlySalary: monthlySalary,
      });
    }
  }, [employee, onChange]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employeeName">Employee Name</Label>
          <Input 
            id="employeeName" 
            value={formValues.employeeName} 
            onChange={(e) => handleInputChange('employeeName', e.target.value)} 
            placeholder="Employee Name"
            readOnly={!!employee}
          />
        </div>
        <div>
          <Label htmlFor="payrollId">Payroll ID</Label>
          <Input 
            id="payrollId" 
            value={formValues.payrollId || ''} 
            onChange={(e) => handleInputChange('payrollId', e.target.value)} 
            placeholder="Payroll ID"
            readOnly={!!employee}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="monthlySalary">Monthly Salary (£)</Label>
          <Input 
            id="monthlySalary" 
            type="number"
            value={formValues.monthlySalary || ''} 
            onChange={(e) => handleNumberInputChange('monthlySalary', e.target.value)} 
            placeholder="0.00"
          />
        </div>
        <div>
          <Label htmlFor="taxCode">Tax Code</Label>
          <Input 
            id="taxCode" 
            value={formValues.taxCode} 
            onChange={(e) => handleInputChange('taxCode', e.target.value)} 
            placeholder="1257L"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="pensionPercentage">Pension Contribution (%)</Label>
          <Input 
            id="pensionPercentage" 
            type="number"
            value={formValues.pensionPercentage || ''} 
            onChange={(e) => handleNumberInputChange('pensionPercentage', e.target.value)} 
            placeholder="0.00"
          />
        </div>
        <div>
          <Label htmlFor="studentLoanPlan">Student Loan Plan</Label>
          <Select 
            onValueChange={(value) => {
              const planValue = value === "none" ? null : parseInt(value);
              handleInputChange('studentLoanPlan', planValue);
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
      </div>
      
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
