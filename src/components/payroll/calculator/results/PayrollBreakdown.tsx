
import { formatCurrency } from "@/lib/formatters";
import { PayrollResult } from "@/services/payroll/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PayrollBreakdownProps {
  result: PayrollResult;
}

export function GrossPayBreakdown({ result }: PayrollBreakdownProps) {
  return (
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
  );
}

export function DeductionsBreakdown({ result }: PayrollBreakdownProps) {
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
  );
}

export function AllowancesBreakdown({ result }: PayrollBreakdownProps) {
  if (!result.additionalAllowances || result.additionalAllowances.length === 0) {
    return null;
  }

  return (
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
  );
}

export function NetPaySummary({ result }: PayrollBreakdownProps) {
  return (
    <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-md">
      <div className="flex justify-between items-center">
        <span className="font-bold text-lg">Net Pay</span>
        <span className="font-bold text-lg text-green-600">{formatCurrency(result.netPay)}</span>
      </div>
    </div>
  );
}
