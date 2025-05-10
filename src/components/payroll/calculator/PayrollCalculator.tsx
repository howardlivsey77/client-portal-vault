import { useState } from 'react';
import { PayrollForm } from '@/components/payroll/calculator/PayrollForm';
import { PayrollCalculatorActions } from '@/components/payroll/calculator/PayrollCalculatorActions';
import { PayrollResults } from '@/components/payroll/calculator/PayrollResults';
import { usePayrollCalculation } from '@/components/payroll/calculator/hooks/usePayrollCalculation';
import { Employee } from '@/hooks/useEmployees';
import { PayPeriod } from '@/services/payroll/utils/financial-year-utils';
import { PayslipDownloader } from './PayslipDownloader';
import { PayrollFormValues } from './types';
import { Button } from "@/components/ui/button";

interface PayrollCalculatorProps {
  employee: Employee;
  payPeriod: PayPeriod;
}

export const PayrollCalculator = ({ employee, payPeriod }: PayrollCalculatorProps) => {
  const { 
    calculationResult, 
    isCalculating, 
    calculatePayroll, 
    clearPayrollResults,
    isClearing,
    setCalculationResult 
  } = usePayrollCalculation(payPeriod);
  const [showResults, setShowResults] = useState(false);
  const [formValues, setFormValues] = useState<PayrollFormValues>({
    employeeId: employee.id,
    employeeName: `${employee.first_name} ${employee.last_name}`,
    payrollId: employee.payroll_id || undefined,
    monthlySalary: employee.monthly_salary || 0,
    taxCode: employee.tax_code || '1257L',
    pensionPercentage: 0,
    studentLoanPlan: employee.student_loan_plan as 1 | 2 | 4 | 5 | null,
    additionalDeductions: [],
    additionalAllowances: [],
    additionalEarnings: []
  });

  const handleClearResults = async () => {
    const success = await clearPayrollResults();
    if (success) {
      setShowResults(false);
      setCalculationResult(null);
    }
  };

  // Format the payPeriod description for display
  const payPeriodDisplay = `Period ${payPeriod.periodNumber}: ${payPeriod.description}`;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">
        Calculate Payroll: {employee.first_name} {employee.last_name}
      </h2>

      {!showResults && (
        <PayrollForm 
          employee={employee}
          formValues={formValues}
          onChange={setFormValues}
          payPeriod={payPeriod}
          onCalculate={(values) => {
            calculatePayroll(values).then((result) => {
              if (result) {
                setShowResults(true);
              }
            });
          }}
          isCalculating={isCalculating}
        />
      )}

      {calculationResult && showResults && (
        <div className="space-y-4">
          <PayrollResults 
            result={calculationResult} 
            payPeriod={payPeriodDisplay}
            onClearResults={handleClearResults}
          />
          
          <div className="flex justify-between items-center pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowResults(false)}
            >
              Back to Calculator
            </Button>
            <PayslipDownloader 
              calculationResult={calculationResult}
              payPeriodDescription={payPeriodDisplay}
              employee={employee}
            />
          </div>
        </div>
      )}
    </div>
  );
};
