
import { useState, useEffect } from 'react';
import { useToast, useEmployees, Employee } from "@/hooks";
import { PayrollCalculator } from "@/components/payroll/calculator/PayrollCalculator";
import { EmployeeNavigation } from "@/components/payroll/EmployeeNavigation";
import { Skeleton } from "@/components/ui/skeleton";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";

interface EmployeePayrollCalculatorProps {
  payPeriod: PayPeriod;
}

export function EmployeePayrollCalculator({ payPeriod }: EmployeePayrollCalculatorProps) {
  const { toast } = useToast();
  const { employees, loading } = useEmployees();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (employees.length > 0 && !currentEmployee) {
      setCurrentEmployee(employees[0]);
    }
  }, [employees, currentEmployee]);

  const handleNavigate = (employeeId: string) => {
    const index = employees.findIndex(emp => emp.id === employeeId);
    if (index !== -1) {
      setCurrentIndex(index);
      setCurrentEmployee(employees[index]);
    }
  };

  const navigateToEmployee = (id: string) => {
    handleNavigate(id);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <h3 className="text-xl font-medium mb-2">No Employees Found</h3>
        <p className="text-gray-600 mb-4">
          You need to add employees before you can calculate payroll.
        </p>
      </div>
    );
  }

  const prevEmployeeId = currentIndex > 0 ? employees[currentIndex - 1]?.id : null;
  const nextEmployeeId = currentIndex < employees.length - 1 ? employees[currentIndex + 1]?.id : null;

  return (
    <div className="space-y-4">
      <EmployeeNavigation 
        prevEmployeeId={prevEmployeeId}
        nextEmployeeId={nextEmployeeId}
        onNavigate={navigateToEmployee}
      />
      
      {currentEmployee && (
        <PayrollCalculator 
          employee={currentEmployee}
          payPeriod={payPeriod}
        />
      )}
    </div>
  );
}
