
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";
import { calculateMonthlyPayroll, PayrollResult } from "@/services/payroll/payrollCalculator";
import { generatePayslip } from "@/utils/payslipGenerator";
import { PayrollForm } from "./PayrollForm";
import { PayrollResults } from "./PayrollResults";
import { PayrollCalculatorProps, PayrollFormValues } from "./types";

export function PayrollCalculator({ employee }: PayrollCalculatorProps) {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<string>("calculator");
  const [payrollDetails, setPayrollDetails] = useState<PayrollFormValues>({
    employeeId: employee?.id || '',
    employeeName: employee ? `${employee.first_name} ${employee.last_name}` : '',
    payrollId: employee?.payroll_id || '',
    monthlySalary: 0,
    taxCode: '1257L', // Standard tax code
    pensionPercentage: 5,
    studentLoanPlan: null,
    additionalDeductions: [],
    additionalAllowances: [],
    additionalEarnings: []
  });
  
  const [calculationResult, setCalculationResult] = useState<PayrollResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [payPeriod, setPayPeriod] = useState<string>(
    new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  );

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
      const filename = `${calculationResult.employeeName.replace(/\s+/g, '-').toLowerCase()}-payslip-${new Date().getTime()}.pdf`;
      generatePayslip(calculationResult, payPeriod, filename);
      
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
          {employee ? `Calculate payroll for ${employee.first_name} ${employee.last_name}` : 'Calculate monthly payroll including tax, NI, and other deductions'}
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
              onPayPeriodChange={setPayPeriod}
            />
          </TabsContent>
          
          <TabsContent value="result">
            {calculationResult && (
              <PayrollResults result={calculationResult} payPeriod={payPeriod} />
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
