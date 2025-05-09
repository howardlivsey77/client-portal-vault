
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Download, Save } from "lucide-react";
import { calculateMonthlyPayroll, PayrollResult } from "@/services/payroll/payrollCalculator";
import { savePayrollResult } from "@/services/payroll/savePayrollResult";
import { generatePayslip } from "@/utils/payslipGenerator";
import { PayrollForm } from "./PayrollForm";
import { PayrollResults } from "./PayrollResults";
import { PayrollCalculatorProps, PayrollFormValues } from "./types";
import { getTaxYear, getTaxPeriod, formatTaxPeriod } from "@/utils/taxYearUtils";

export function PayrollCalculator({ employee }: PayrollCalculatorProps) {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<string>("calculator");
  
  // Get current tax year and format tax period
  const currentTaxYear = getTaxYear();
  // Set tax period to 1 (April) for 2025-2026 tax year
  const currentTaxPeriod = 1; // Fixed to period 1 (April)
  
  const [payrollDetails, setPayrollDetails] = useState<PayrollFormValues>({
    employeeId: employee?.id || '',
    employeeName: employee ? `${employee.first_name} ${employee.last_name}` : '',
    payrollId: employee?.payroll_id || '',
    monthlySalary: employee?.monthly_salary || 0,
    taxCode: employee?.tax_code || '1257L', // Standard tax code
    taxRegion: 'UK', // Default to UK/England
    pensionPercentage: 5,
    studentLoanPlan: employee?.student_loan_plan || null,
    additionalDeductions: [],
    additionalAllowances: [],
    additionalEarnings: [],
    nicCode: employee?.nic_code || 'A',
    taxYear: currentTaxYear,
    taxPeriod: currentTaxPeriod,
    useEmergencyTax: employee?.week_one_month_one || false,
    isNewEmployee: false
  });
  
  const [calculationResult, setCalculationResult] = useState<PayrollResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [payPeriod, setPayPeriod] = useState<string>(
    "April 2025 (Period 1)" // Default to April 2025 (Period 1)
  );
  const [autoCalculate, setAutoCalculate] = useState<boolean>(true);

  // Auto-calculate effect
  useEffect(() => {
    if (autoCalculate && payrollDetails.monthlySalary > 0 && payrollDetails.employeeName) {
      try {
        const calculatePayroll = async () => {
          const result = await calculateMonthlyPayroll(payrollDetails);
          setCalculationResult(result);
        };
        calculatePayroll();
      } catch (error) {
        console.error("Auto payroll calculation error:", error);
      }
    }
  }, [payrollDetails, autoCalculate]);

  const handleCalculatePayroll = async () => {
    try {
      setIsCalculating(true);
      const result = await calculateMonthlyPayroll(payrollDetails);
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

  const handleSavePayrollResult = async () => {
    if (!calculationResult) return;
    
    try {
      setIsSaving(true);
      
      const result = await savePayrollResult(calculationResult, payPeriod);
      
      if (result.success) {
        toast({
          title: "Payroll Saved",
          description: "Payroll result has been saved to the database."
        });
      } else {
        toast({
          title: "Save Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error saving payroll result:", error);
      toast({
        title: "Save Error",
        description: "There was an error saving the payroll result.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>UK Payroll Calculator</CardTitle>
        <CardDescription>
          {employee ? 
            `Calculate payroll for ${employee.first_name} ${employee.last_name} (${currentTaxYear} Tax Year)` : 
            `Calculate monthly payroll including tax, NI, and other deductions - ${currentTaxYear} Tax Year`
          }
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
          <div className="flex gap-2">
            <Button 
              onClick={handleSavePayrollResult}
              variant="secondary"
              disabled={isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Result"}
            </Button>
            <Button 
              onClick={handleDownloadPayslip}
              variant="secondary"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Payslip
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
