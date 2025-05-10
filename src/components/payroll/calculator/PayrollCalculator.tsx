
import { useState } from 'react';
import { PayrollForm } from '@/components/payroll/calculator/PayrollForm';
import { PayrollCalculatorActions } from '@/components/payroll/calculator/PayrollCalculatorActions';
import { PayrollResults } from '@/components/payroll/calculator/PayrollResults';
import { usePayrollCalculation } from '@/components/payroll/calculator/hooks/usePayrollCalculation';
import { Employee } from '@/hooks/useEmployees';
import { PayPeriod } from '@/services/payroll/utils/financial-year-utils';
import { PayslipDownloader } from './PayslipDownloader';

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
            <PayrollCalculatorActions
              onBack={() => setShowResults(false)}
            />
            <PayslipDownloader 
              employee={employee}
              result={calculationResult}
              payPeriod={payPeriodDisplay}
            />
          </div>
        </div>
      )}
    </div>
  );
};
