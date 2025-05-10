
import { formatCurrency } from "@/lib/formatters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PayrollResult } from "@/services/payroll/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PayrollResultsProps {
  result: PayrollResult;
  payPeriod: string; // This is now a string description from PayPeriod.description
}

export function PayrollResults({ result, payPeriod }: PayrollResultsProps) {
  const [showFreePayDetails, setShowFreePayDetails] = useState(false);

  // Map student loan plan numbers to descriptive text
  const getStudentLoanPlanName = (plan: number | null) => {
    if (!plan) return "None";
    const planMap: Record<number, string> = {
      1: "Plan 1",
      2: "Plan 2",
      4: "Plan 4",
      5: "Plan 5"
    };
    return planMap[plan] || `Plan ${plan}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-md">
        <h3 className="text-lg font-medium mb-2">Payroll Summary</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>Employee:</div>
          <div className="font-medium">{result.employeeName}</div>
          {result.payrollId && (
            <>
              <div>Payroll ID:</div>
              <div className="font-medium">{result.payrollId}</div>
            </>
          )}
          <div>Pay Period:</div>
          <div className="font-medium">{payPeriod}</div>
          <div>Tax Code:</div>
          <div className="font-medium">{result.taxCode}</div>
          <div>Gross Pay:</div>
          <div className="font-medium">{formatCurrency(result.grossPay)}</div>
          <div>Net Pay:</div>
          <div className="font-medium text-green-600">{formatCurrency(result.netPay)}</div>
          {result.studentLoanPlan && (
            <>
              <div>Student Loan Plan:</div>
              <div className="font-medium">{getStudentLoanPlanName(result.studentLoanPlan)}</div>
            </>
          )}
          {result.pensionPercentage > 0 && (
            <>
              <div>Pension Contribution:</div>
              <div className="font-medium">{result.pensionPercentage}%</div>
            </>
          )}
        </div>
      </div>
      
      {/* Tax-Free Allowance Section */}
      <div className="bg-muted p-4 rounded-md">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Tax-Free Allowance</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Free Pay is calculated based on your tax code and represents your monthly tax-free allowance.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>Tax Code:</div>
          <div className="font-medium">{result.taxCode}</div>
          <div>Monthly Free Pay:</div>
          <div className="font-medium text-green-600">{formatCurrency(result.freePay)}</div>
        </div>
        
        <Collapsible 
          open={showFreePayDetails} 
          onOpenChange={setShowFreePayDetails} 
          className="mt-2"
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="flex w-full justify-between p-2 text-sm">
              <span>{showFreePayDetails ? "Hide calculation details" : "Show calculation details"}</span>
              {showFreePayDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="bg-slate-50 dark:bg-slate-900 p-2 rounded mt-2">
            <p className="text-sm text-muted-foreground mb-2">
              The free pay amount is calculated based on the numeric part of your tax code.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </div>
      
      {/* Gross Pay Build-Up Section */}
      <div className="bg-muted p-4 rounded-md">
        <h3 className="text-lg font-medium mb-2">Gross Pay Build-Up</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Monthly Salary</TableCell>
              <TableCell className="text-right">{formatCurrency(result.monthlySalary)}</TableCell>
            </TableRow>
            {result.additionalEarnings && result.additionalEarnings.length > 0 && result.additionalEarnings.map((earning, index) => (
              <TableRow key={`earning-${index}`}>
                <TableCell>{earning.description}</TableCell>
                <TableCell className="text-right text-green-500">+{formatCurrency(earning.amount)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t">
              <TableCell className="font-medium">Gross Pay</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(result.grossPay)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      
      {/* Deductions Section */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Deductions</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Income Tax (Tax Code: {result.taxCode}, Free Pay: {formatCurrency(result.freePay)})</TableCell>
            <TableCell className="text-right text-red-500">-{formatCurrency(result.incomeTax)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>National Insurance</TableCell>
            <TableCell className="text-right text-red-500">-{formatCurrency(result.nationalInsurance)}</TableCell>
          </TableRow>
          {result.studentLoan > 0 && (
            <TableRow>
              <TableCell>Student Loan ({getStudentLoanPlanName(result.studentLoanPlan)})</TableCell>
              <TableCell className="text-right text-red-500">-{formatCurrency(result.studentLoan)}</TableCell>
            </TableRow>
          )}
          {result.pensionContribution > 0 && (
            <TableRow>
              <TableCell>Pension Contribution ({result.pensionPercentage}%)</TableCell>
              <TableCell className="text-right text-red-500">-{formatCurrency(result.pensionContribution)}</TableCell>
            </TableRow>
          )}
          {result.additionalDeductions && result.additionalDeductions.length > 0 && result.additionalDeductions.map((deduction, index) => (
            <TableRow key={`deduction-${index}`}>
              <TableCell>{deduction.description}</TableCell>
              <TableCell className="text-right text-red-500">-{formatCurrency(deduction.amount)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t">
            <TableCell className="font-medium">Total Deductions</TableCell>
            <TableCell className="text-right font-medium text-red-500">-{formatCurrency(result.totalDeductions)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      
      {/* Allowances Section - Only show if there are allowances */}
      {result.additionalAllowances && result.additionalAllowances.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Allowances</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.additionalAllowances.map((allowance, index) => (
              <TableRow key={`allowance-${index}`}>
                <TableCell>{allowance.description}</TableCell>
                <TableCell className="text-right text-green-500">+{formatCurrency(allowance.amount)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t">
              <TableCell className="font-medium">Total Allowances</TableCell>
              <TableCell className="text-right font-medium text-green-500">+{formatCurrency(result.totalAllowances)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
      
      {/* Net Pay Section */}
      <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-md">
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg">Net Pay</span>
          <span className="font-bold text-lg text-green-600">{formatCurrency(result.netPay)}</span>
        </div>
      </div>
    </div>
  );
}
