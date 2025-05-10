
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";
import { calculateMonthlyPayroll } from "@/services/payroll/payrollCalculator";
import { generatePayslip } from "@/utils/payslipGenerator";
import { PayrollForm } from "./PayrollForm";
import { PayrollResults } from "./PayrollResults";
import { PayrollCalculatorProps, PayrollFormValues } from "./types";
import { PayPeriod } from "@/services/payroll/utils/financial-year-utils";

export function PayrollCalculator({ employee, payPeriod }: PayrollCalculatorProps) {
  const { toast } = useToast();
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
  
  // Update payroll details when employee changes
  useEffect(() => {
    if (employee) {
      // Convert student loan plan to the correct type (1, 2, 4, 5 or null)
      const studentLoanPlan = employee.student_loan_plan === 1 ? 1 :
                              employee.student_loan_plan === 2 ? 2 :
                              employee.student_loan_plan === 4 ? 4 :
                              employee.student_loan_plan === 5 ? 5 : null;

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
  
  const [calculationResult, setCalculationResult] = useState<any | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState<boolean>(true);

  // Auto-calculate effect
  useEffect(() => {
    if (autoCalculate && payrollDetails.monthlySalary > 0 && payrollDetails.employeeName) {
      try {
        const result = calculateMonthlyPayroll(payrollDetails);
        setCalculationResult(result);
      } catch (error) {
        console.error("Auto payroll calculation error:", error);
      }
    }
  }, [payrollDetails, autoCalculate]);

  const handleCalculatePayroll = () => {
    try {
      setIsCalculating(true);
      const result = calculateMonthlyPayroll(payrollDetails);
      setCalculationResult(result);
      setIsCalculating(false);
      
      // Switch to result tab
      setSelectedTab("result");
    } catch (error) {
      console.error("Payroll calculation error:", error);
      toast({
        title: "Calculation Error",
        description: "There was an error calculating the payroll. Please check your inputs.",
        variant: "destructive"
      });
      setIsCalculating(false);
    }
  };

  const handleDownloadPayslip = () => {
    if (!calculationResult) return;
    
    try {
      const filename = `${calculationResult.employeeName.replace(/\s+/g, '-').toLowerCase()}-payslip-${payPeriod.description.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      generatePayslip(calculationResult, payPeriod.description, filename);
      
      toast({
        title: "Payslip Generated",
        description: "Your payslip has been downloaded."
      });
    } catch (error) {
      console.error("Error generating payslip:", error);
      toast({
        title: "Generation Error",
        description: "There was an error generating the payslip.",
        variant: "destructive"
      });
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
      <CardFooter className="flex justify-between">
        {selectedTab === "calculator" ? (
          <Button 
            onClick={handleCalculatePayroll} 
            disabled={isCalculating || !payrollDetails.monthlySalary || !payrollDetails.employeeName}
          >
            {isCalculating ? "Calculating..." : "Calculate Payroll"}
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => setSelectedTab("calculator")}
          >
            Back to Calculator
          </Button>
        )}
        
        {calculationResult && selectedTab === "result" && (
          <Button 
            onClick={handleDownloadPayslip}
            variant="secondary"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Payslip
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
