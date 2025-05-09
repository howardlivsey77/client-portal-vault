
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircle, X } from "lucide-react";
import { Employee } from "@/types/employee-types";
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

  // Handle additional earnings
  const addEarning = () => {
    const newEarnings = [
      ...(formValues.additionalEarnings || []), 
      { description: '', amount: 0 }
    ];
    handleInputChange('additionalEarnings', newEarnings);
  };

  const updateEarning = (index: number, field: 'description' | 'amount', value: any) => {
    if (!formValues.additionalEarnings) return;
    
    const updatedEarnings = [...formValues.additionalEarnings];
    if (field === 'amount') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      updatedEarnings[index] = { 
        ...updatedEarnings[index], 
        [field]: !isNaN(numValue) ? numValue : 0 
      };
    } else {
      updatedEarnings[index] = { ...updatedEarnings[index], [field]: value };
    }
    
    handleInputChange('additionalEarnings', updatedEarnings);
  };

  const removeEarning = (index: number) => {
    if (!formValues.additionalEarnings) return;
    
    const updatedEarnings = [...formValues.additionalEarnings];
    updatedEarnings.splice(index, 1);
    handleInputChange('additionalEarnings', updatedEarnings);
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
      
      {/* Additional Earnings Section */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Additional Earnings</Label>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={addEarning}
          >
            <PlusCircle className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
        
        {formValues.additionalEarnings && formValues.additionalEarnings.length > 0 && (
          <div className="space-y-2">
            {formValues.additionalEarnings.map((earning, index) => (
              <div key={`earning-${index}`} className="grid grid-cols-[1fr,120px,40px] gap-2">
                <Input
                  placeholder="Description (e.g., Overtime)"
                  value={earning.description}
                  onChange={(e) => updateEarning(index, 'description', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={earning.amount || ''}
                  onChange={(e) => updateEarning(index, 'amount', e.target.value)}
                />
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon"
                  onClick={() => removeEarning(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
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
