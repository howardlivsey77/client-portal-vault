import { formatCurrency } from "@/lib/formatters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PayrollResult } from "@/services/payroll/types";

interface PayrollResultsProps {
  result: PayrollResult;
  payPeriod: string; // This is now a string description from PayPeriod.description
}

export function PayrollResults({ result, payPeriod }: PayrollResultsProps) {
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
            <TableCell>Income Tax</TableCell>
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
