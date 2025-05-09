
import { useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Employee } from "@/types/employee-types";
import { PayrollFormValues } from "../types";

interface EmployeeInfoFieldsProps {
  employee?: Employee | null;
  formValues: PayrollFormValues;
  onChange: (values: PayrollFormValues) => void;
  onInputChange: (field: keyof PayrollFormValues, value: any) => void;
}

export function EmployeeInfoFields({ 
  employee, 
  formValues, 
  onChange, 
  onInputChange 
}: EmployeeInfoFieldsProps) {
  
  useEffect(() => {
    if (employee) {
      const hourlyRate = employee.hourly_rate || 0;
      const hoursPerWeek = employee.hours_per_week || 0;
      
      // Calculate monthly salary based on hourly rate and weekly hours
      // Formula: (weekly hours × hourly rate) ÷ 7 × 365 ÷ 12
      const monthlySalary = Number(((hourlyRate * hoursPerWeek) / 7 * 365 / 12).toFixed(2));

      onChange({
        ...formValues,
        employeeId: employee.id,
        employeeName: `${employee.first_name} ${employee.last_name}`,
        payrollId: employee.payroll_id || '',
        monthlySalary: monthlySalary,
      });
    }
  }, [employee, onChange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="employeeName">Employee Name</Label>
        <Input 
          id="employeeName" 
          value={formValues.employeeName} 
          onChange={(e) => onInputChange('employeeName', e.target.value)} 
          placeholder="Employee Name"
          readOnly={!!employee}
        />
      </div>
      <div>
        <Label htmlFor="payrollId">Payroll ID</Label>
        <Input 
          id="payrollId" 
          value={formValues.payrollId || ''} 
          onChange={(e) => onInputChange('payrollId', e.target.value)} 
          placeholder="Payroll ID"
          readOnly={!!employee}
        />
      </div>
    </div>
  );
}
