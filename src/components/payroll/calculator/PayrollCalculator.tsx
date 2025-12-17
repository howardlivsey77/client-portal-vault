
import { useState } from 'react';
import { PayrollForm } from '@/components/payroll/calculator/PayrollForm';
import { PayrollCalculatorActions } from '@/components/payroll/calculator/PayrollCalculatorActions';
import { PayrollResults } from '@/components/payroll/calculator/PayrollResults';
import { usePayrollCalculation } from '@/components/payroll/calculator/hooks/usePayrollCalculation';
import { Employee } from '@/hooks';
import { PayPeriod } from '@/services/payroll/utils/financial-year-utils';
import { PayslipDownloader } from './PayslipDownloader';
import { PayrollFormValues } from './types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building } from "lucide-react";

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
    setCalculationResult,
    currentCompany
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
    additionalEarnings: [],
    // NHS Pension fields
    isNHSPensionMember: employee.nhs_pension_member || false,
    previousYearPensionablePay: employee.previous_year_pensionable_pay || null
  });

  const handleClearResults = async () => {
    const success = await clearPayrollResults();
    if (success) {
      setShowResults(false);
      setCalculationResult(null);
    }
  };

  const handleCalculate = async (values: PayrollFormValues) => {
    const result = await calculatePayroll(values);
    if (result) {
      console.log("Final calculation result to display:", result);
      setShowResults(true);
    }
  };

  // Format the payPeriod description for display
  const payPeriodDisplay = `Period ${payPeriod.periodNumber}: ${payPeriod.description}`;

  return (
    <div className="space-y-6">
      {/* Company Context Card */}
      {currentCompany && (
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-primary">
              <Building className="h-4 w-4" />
              <span className="text-sm font-medium">
                Payroll calculations will be saved to: <strong>{currentCompany.name}</strong>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {!currentCompany && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-amber-700">
              <Building className="h-4 w-4" />
              <span className="text-sm font-medium">
                ⚠️ No company selected. Please select a company to save payroll results.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <h2 className="text-2xl font-semibold mb-4">
        Calculate Payroll: {employee.first_name} {employee.last_name}
      </h2>

      {!showResults && (
        <PayrollForm 
          employee={employee}
          formValues={formValues}
          onChange={setFormValues}
          payPeriod={payPeriod}
          onCalculate={handleCalculate}
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
