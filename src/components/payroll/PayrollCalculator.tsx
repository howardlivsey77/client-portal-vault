
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateMonthlyPayroll, PayrollDetails, PayrollResult } from "@/services/payroll/ukPayrollCalculator";
import { formatCurrency } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";
import { Employee } from "@/hooks/useEmployees";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generatePayslip } from "@/utils/payslipGenerator";

interface PayrollCalculatorProps {
  employee?: Employee | null;
}

export function PayrollCalculator({ employee }: PayrollCalculatorProps) {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<string>("calculator");
  const [payrollDetails, setPayrollDetails] = useState<PayrollDetails>({
    employeeId: employee?.id || '',
    employeeName: employee ? `${employee.first_name} ${employee.last_name}` : '',
    payrollId: employee?.payroll_id || '',
    monthlySalary: 0,
    taxCode: '1257L', // Standard tax code
    pensionPercentage: 5,
    studentLoanPlan: null,
    additionalDeductions: [],
    additionalAllowances: []
  });
  
  const [calculationResult, setCalculationResult] = useState<PayrollResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [payPeriod, setPayPeriod] = useState<string>(
    new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  );

  const handleInputChange = (field: keyof PayrollDetails, value: any) => {
    setPayrollDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNumberInputChange = (field: keyof PayrollDetails, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    
    if (!isNaN(numValue)) {
      handleInputChange(field, numValue);
    }
  };

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
          Calculate monthly payroll including tax, NI, and other deductions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="result" disabled={!calculationResult}>Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employeeName">Employee Name</Label>
                  <Input 
                    id="employeeName" 
                    value={payrollDetails.employeeName} 
                    onChange={(e) => handleInputChange('employeeName', e.target.value)} 
                    placeholder="Employee Name"
                  />
                </div>
                <div>
                  <Label htmlFor="payrollId">Payroll ID</Label>
                  <Input 
                    id="payrollId" 
                    value={payrollDetails.payrollId || ''} 
                    onChange={(e) => handleInputChange('payrollId', e.target.value)} 
                    placeholder="Payroll ID"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthlySalary">Monthly Salary (£)</Label>
                  <Input 
                    id="monthlySalary" 
                    type="number"
                    value={payrollDetails.monthlySalary || ''} 
                    onChange={(e) => handleNumberInputChange('monthlySalary', e.target.value)} 
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="taxCode">Tax Code</Label>
                  <Input 
                    id="taxCode" 
                    value={payrollDetails.taxCode} 
                    onChange={(e) => handleInputChange('taxCode', e.target.value)} 
                    placeholder="1257L"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pensionPercentage">Pension Contribution (%)</Label>
                  <Input 
                    id="pensionPercentage" 
                    type="number"
                    value={payrollDetails.pensionPercentage || ''} 
                    onChange={(e) => handleNumberInputChange('pensionPercentage', e.target.value)} 
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="studentLoanPlan">Student Loan Plan</Label>
                  <Select 
                    onValueChange={(value) => {
                      const planValue = value === "none" ? null : parseInt(value);
                      handleInputChange('studentLoanPlan', planValue);
                    }} 
                    value={payrollDetails.studentLoanPlan?.toString() || "none"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Student Loan</SelectItem>
                      <SelectItem value="1">Plan 1</SelectItem>
                      <SelectItem value="2">Plan 2</SelectItem>
                      <SelectItem value="4">Plan 4</SelectItem>
                      <SelectItem value="5">Plan 5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="payPeriod">Pay Period</Label>
                <Input 
                  id="payPeriod" 
                  value={payPeriod} 
                  onChange={(e) => setPayPeriod(e.target.value)} 
                  placeholder="May 2025"
                />
              </div>

              {/* Additional fields for deductions/allowances could be added here */}
            </div>
          </TabsContent>
          
          <TabsContent value="result">
            {calculationResult && (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-2">Payroll Summary</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>Employee:</div>
                    <div className="font-medium">{calculationResult.employeeName}</div>
                    {calculationResult.payrollId && (
                      <>
                        <div>Payroll ID:</div>
                        <div className="font-medium">{calculationResult.payrollId}</div>
                      </>
                    )}
                    <div>Pay Period:</div>
                    <div className="font-medium">{payPeriod}</div>
                    <div>Gross Pay:</div>
                    <div className="font-medium">{formatCurrency(calculationResult.grossPay)}</div>
                    <div>Net Pay:</div>
                    <div className="font-medium text-green-600">{formatCurrency(calculationResult.netPay)}</div>
                  </div>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Gross Pay</TableCell>
                      <TableCell className="text-right">{formatCurrency(calculationResult.grossPay)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Income Tax</TableCell>
                      <TableCell className="text-right text-red-500">-{formatCurrency(calculationResult.incomeTax)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>National Insurance</TableCell>
                      <TableCell className="text-right text-red-500">-{formatCurrency(calculationResult.nationalInsurance)}</TableCell>
                    </TableRow>
                    {calculationResult.studentLoan > 0 && (
                      <TableRow>
                        <TableCell>Student Loan</TableCell>
                        <TableCell className="text-right text-red-500">-{formatCurrency(calculationResult.studentLoan)}</TableCell>
                      </TableRow>
                    )}
                    {calculationResult.pensionContribution > 0 && (
                      <TableRow>
                        <TableCell>Pension Contribution</TableCell>
                        <TableCell className="text-right text-red-500">-{formatCurrency(calculationResult.pensionContribution)}</TableCell>
                      </TableRow>
                    )}
                    {calculationResult.additionalDeductions.map((deduction, index) => (
                      <TableRow key={`deduction-${index}`}>
                        <TableCell>{deduction.description}</TableCell>
                        <TableCell className="text-right text-red-500">-{formatCurrency(deduction.amount)}</TableCell>
                      </TableRow>
                    ))}
                    {calculationResult.additionalAllowances.map((allowance, index) => (
                      <TableRow key={`allowance-${index}`}>
                        <TableCell>{allowance.description}</TableCell>
                        <TableCell className="text-right text-green-500">+{formatCurrency(allowance.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2">
                      <TableCell className="font-bold">Net Pay</TableCell>
                      <TableCell className="text-right font-bold text-green-600">{formatCurrency(calculationResult.netPay)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
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
