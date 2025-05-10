
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateMonthlyPayroll } from "@/services/payroll/payrollCalculator";
import { PayrollForm } from "./PayrollForm";
import { PayrollResults } from "./PayrollResults";
import { PayrollCalculatorProps, PayrollFormValues } from "./types";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";
import { useAuth } from "@/providers/AuthProvider";
import { usePayrollCalculation } from "./hooks/usePayrollCalculation";
import { PayrollCalculatorActions } from "./PayrollCalculatorActions";

export function PayrollCalculator({ employee, payPeriod }: PayrollCalculatorProps) {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<string>("calculator");
  const [payrollDetails, setPayrollDetails] = useState<PayrollFormValues>({
    employeeId: employee?.id || '',
    employeeName: employee ? `${employee.first_name} ${employee.last_name}` : '',
    payrollId: employee?.payroll_id || '',
    monthlySalary: 0,
    taxCode: employee?.tax_code || '1257L', // Use employee's tax code if available, otherwise default
    pensionPercentage: 5,
    studentLoanPlan: null,
    additionalDeductions: [],
    additionalAllowances: [],
    additionalEarnings: []
  });
  
  // Get payroll calculation functions and state
  const {
    calculationResult,
    isCalculating,
    isSaving,
    calculatePayroll,
    setCalculationResult
  } = usePayrollCalculation(payPeriod);
  
  const [autoCalculate, setAutoCalculate] = useState<boolean>(true);
  
  // Update payroll details when employee changes
  useEffect(() => {
    if (employee) {
      // Convert student loan plan to the correct type (1, 2, 4, 5 or null)
      let studentLoanPlan = null;
      if (employee.student_loan_plan === 1) studentLoanPlan = 1;
      else if (employee.student_loan_plan === 2) studentLoanPlan = 2; 
      else if (employee.student_loan_plan === 4) studentLoanPlan = 4;
      else if (employee.student_loan_plan === 5) studentLoanPlan = 5;

      setPayrollDetails(prevDetails => ({
        ...prevDetails,
        employeeId: employee.id,
        employeeName: `${employee.first_name} ${employee.last_name}`,
        payrollId: employee.payroll_id || '',
        taxCode: employee.tax_code || '1257L', // Use employee's tax code with fallback
        studentLoanPlan: studentLoanPlan
      }));
    }
  }, [employee]);

  // Auto-calculate effect
  useEffect(() => {
    if (autoCalculate && payrollDetails.monthlySalary > 0 && payrollDetails.employeeName) {
      try {
        const result = calculateMonthlyPayroll(payrollDetails);
        // Calculate taxable pay
        result.taxablePay = result.grossPay - result.freePay;
        setCalculationResult(result);
      } catch (error) {
        console.error("Auto payroll calculation error:", error);
      }
    }
  }, [payrollDetails, autoCalculate, setCalculationResult]);

  const handleCalculatePayroll = async () => {
    const result = await calculatePayroll(payrollDetails);
    if (result) {
      // Switch to result tab
      setSelectedTab("result");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>UK Payroll Calculator</CardTitle>
        <CardDescription>
          {employee ? `Calculate payroll for ${employee.first_name} ${employee.last_name} - ${payPeriod.description}` : 'Calculate monthly payroll including tax, NI, and other deductions'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="result" disabled={!calculationResult}>Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator">
            <PayrollForm
              employee={employee}
              formValues={payrollDetails}
              onChange={setPayrollDetails}
              payPeriod={payPeriod}
            />
          </TabsContent>
          
          <TabsContent value="result">
            {calculationResult && (
              <PayrollResults 
                result={calculationResult} 
                payPeriod={payPeriod.description} 
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <PayrollCalculatorActions
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          isCalculating={isCalculating}
          isSaving={isSaving}
          payrollDetails={payrollDetails}
          calculationResult={calculationResult}
          onCalculate={handleCalculatePayroll}
          payPeriodDescription={payPeriod.description}
        />
      </CardFooter>
    </Card>
  );
}
