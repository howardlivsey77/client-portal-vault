
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Save, Info } from "lucide-react";
import { PayrollForm } from "./PayrollForm";
import { PayrollResults } from "./PayrollResults";
import { PayrollFormValues } from "./types";
import { PayrollResult } from "@/services/payroll/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PayrollCalculatorUIProps {
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  payrollDetails: PayrollFormValues;
  setPayrollDetails: (details: PayrollFormValues) => void;
  calculationResult: PayrollResult | null;
  isCalculating: boolean;
  isSaving: boolean;
  payPeriod: string;
  setPayPeriod: (period: string) => void;
  employee: any; // Using the same type as the original component
  handleCalculatePayroll: () => Promise<void>;
  handleDownloadPayslip: () => void;
  handleSavePayrollResult: () => Promise<void>;
}

export function PayrollCalculatorUI({
  selectedTab,
  setSelectedTab,
  payrollDetails,
  setPayrollDetails,
  calculationResult,
  isCalculating,
  isSaving,
  payPeriod,
  setPayPeriod,
  employee,
  handleCalculatePayroll,
  handleDownloadPayslip,
  handleSavePayrollResult
}: PayrollCalculatorUIProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>UK Payroll Calculator</CardTitle>
            <CardDescription>
              {employee ? 
                `Calculate payroll for ${employee.first_name} ${employee.last_name} (${payrollDetails.taxYear} Tax Year)` : 
                `Calculate monthly payroll including tax, NI, and other deductions - ${payrollDetails.taxYear} Tax Year`
              }
            </CardDescription>
          </div>
          {calculationResult && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-sm bg-muted px-2 py-1 rounded">
                    <Info className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span>Taxable Pay: <span className="font-medium">{new Intl.NumberFormat('en-GB', {
                      style: 'currency',
                      currency: 'GBP'
                    }).format(calculationResult.taxablePay)}</span></span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Taxable pay is your gross pay minus pension contributions and other pre-tax deductions.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
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
