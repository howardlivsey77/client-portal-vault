
import { useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Employee } from "@/types";
import { PayrollFormValues } from "../types";
import { calculateMonthlySalary } from "@/lib/formatters";

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
      // Always calculate monthly salary from hourly rate and hours per week
      const monthlySalary = calculateMonthlySalary(
        employee.hourly_rate || 0,
        employee.hours_per_week || 0
      );

      // Convert student loan plan to the correct type (1, 2, 4, 5 or null)
      const studentLoanPlan = employee.student_loan_plan === 1 ? 1 :
                              employee.student_loan_plan === 2 ? 2 :
                              employee.student_loan_plan === 4 ? 4 :
                              employee.student_loan_plan === 5 ? 5 : null;

      onChange({
        ...formValues,
        employeeId: employee.id,
        employeeName: `${employee.first_name} ${employee.last_name}`,
        payrollId: employee.payroll_id || '',
        monthlySalary: monthlySalary,
        taxCode: employee.tax_code || '1257L',
        studentLoanPlan: studentLoanPlan
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
