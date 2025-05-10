
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

export function PayrollCalculator({ employee, payPeriod }: PayrollCalculatorProps) {
  const { toast } = useToast();
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
  const [isSaving, setIsSaving] = useState(false);
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

  const savePayrollResultToDatabase = async (result: any) => {
    if (!employee || !user) {
      console.error("Missing employee or user data for saving payroll result");
      return false;
    }
    
    try {
      setIsSaving(true);
      
      const payrollPeriodDate = new Date(payPeriod.year, payPeriod.month - 1, 1);
      
      // Data to save to the database
      const payrollData = {
        employee_id: result.employeeId,
        payroll_period: payrollPeriodDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        tax_year: `${payPeriod.year}/${(payPeriod.year + 1).toString().substring(2)}`,
        tax_period: payPeriod.periodNumber,
        tax_code: result.taxCode,
        student_loan_plan: result.studentLoanPlan || null,
        
        // Financial values - convert to pence/pennies for storage
        gross_pay_this_period: Math.round(result.grossPay * 100),
        taxable_pay_this_period: Math.round((result.grossPay - result.freePay) * 100),
        free_pay_this_period: Math.round(result.freePay * 100),
        income_tax_this_period: Math.round(result.incomeTax * 100),
        
        pay_liable_to_nic_this_period: Math.round(result.grossPay * 100),
        nic_employee_this_period: Math.round(result.nationalInsurance * 100),
        nic_employer_this_period: 0, // Default to 0, update if available
        nic_letter: 'A', // Default, update if available
        
        student_loan_this_period: Math.round(result.studentLoan * 100),
        employee_pension_this_period: Math.round(result.pensionContribution * 100),
        employer_pension_this_period: 0, // Default to 0, update if available
        
        // NI earnings bands - defaults
        earnings_at_lel_this_period: 0,
        earnings_lel_to_pt_this_period: 0,
        earnings_pt_to_uel_this_period: 0,
        earnings_above_st_this_period: 0,
        earnings_above_uel_this_period: 0,
        
        // Net pay calculation
        net_pay_this_period: Math.round(result.netPay * 100),
        
        // Year-to-date values - would normally be cumulative, but we'll start fresh
        gross_pay_ytd: Math.round(result.grossPay * 100),
        taxable_pay_ytd: Math.round((result.grossPay - result.freePay) * 100),
        income_tax_ytd: Math.round(result.incomeTax * 100),
        nic_employee_ytd: Math.round(result.nationalInsurance * 100)
      };
      
      // Check if a record already exists for this employee and pay period
      const { data: existingRecord } = await supabase
        .from('payroll_results')
        .select('id')
        .eq('employee_id', result.employeeId)
        .eq('payroll_period', payrollData.payroll_period)
        .maybeSingle();
      
      let saveResponse;
      
      if (existingRecord) {
        // Update existing record
        saveResponse = await supabase
          .from('payroll_results')
          .update(payrollData)
          .eq('id', existingRecord.id);
      } else {
        // Insert new record
        saveResponse = await supabase
          .from('payroll_results')
          .insert(payrollData);
      }
      
      if (saveResponse.error) {
        throw saveResponse.error;
      }
      
      return true;
    } catch (error) {
      console.error("Error saving payroll result:", error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCalculatePayroll = async () => {
    try {
      setIsCalculating(true);
      const result = calculateMonthlyPayroll(payrollDetails);
      setCalculationResult(result);
      
      // Save the result to the database
      const saved = await savePayrollResultToDatabase(result);
      
      if (!saved) {
        toast({
          title: "Database Save Warning",
          description: "Calculation completed but there was an issue saving to the database.",
          variant: "destructive"
        });
      }
      
      // Switch to result tab
      setSelectedTab("result");
      setIsCalculating(false);
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
            disabled={isCalculating || isSaving || !payrollDetails.monthlySalary || !payrollDetails.employeeName}
          >
            {isCalculating ? "Calculating..." : isSaving ? "Saving..." : "Calculate Payroll"}
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
