
import { formatCurrency } from "@/lib/formatters";
import { PayrollResult } from "@/services/payroll/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBrandColors } from "@/brand";

interface PayrollBreakdownProps {
  result: PayrollResult;
}

export function GrossPayBreakdown({ result }: PayrollBreakdownProps) {
  const brandColors = useBrandColors();
  const positiveStyle = { color: `hsl(${brandColors.positive})` };
  
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
              <TableCell className="text-right" style={positiveStyle}>+{formatCurrency(earning.amount)}</TableCell>
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
  const getStudentLoanPlanName = (plan: number | string | null) => {
    if (!plan) return "None";
    const planMap: Record<string | number, string> = {
      1: "Plan 1",
      2: "Plan 2",
      4: "Plan 4",
      PGL: "Postgraduate Loan"
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
          <TableCell className="text-right text-destructive">-{formatCurrency(result.incomeTax)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>National Insurance</TableCell>
          <TableCell className="text-right text-destructive">-{formatCurrency(result.nationalInsurance)}</TableCell>
        </TableRow>
        {result.studentLoan > 0 && (
          <TableRow>
            <TableCell>Student Loan ({getStudentLoanPlanName(result.studentLoanPlan)})</TableCell>
            <TableCell className="text-right text-destructive">-{formatCurrency(result.studentLoan)}</TableCell>
          </TableRow>
        )}
        {result.pensionContribution > 0 && (
          <TableRow>
            <TableCell>Pension Contribution ({result.pensionPercentage}%)</TableCell>
            <TableCell className="text-right text-destructive">-{formatCurrency(result.pensionContribution)}</TableCell>
          </TableRow>
        )}
        {result.additionalDeductions && result.additionalDeductions.length > 0 && result.additionalDeductions.map((deduction, index) => (
          <TableRow key={`deduction-${index}`}>
            <TableCell>{deduction.description}</TableCell>
            <TableCell className="text-right text-destructive">-{formatCurrency(deduction.amount)}</TableCell>
          </TableRow>
        ))}
        <TableRow className="border-t">
          <TableCell className="font-medium">Total Deductions</TableCell>
          <TableCell className="text-right font-medium text-destructive">-{formatCurrency(result.totalDeductions)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

export function AllowancesBreakdown({ result }: PayrollBreakdownProps) {
  const brandColors = useBrandColors();
  const positiveStyle = { color: `hsl(${brandColors.positive})` };
  
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
            <TableCell className="text-right" style={positiveStyle}>+{formatCurrency(allowance.amount)}</TableCell>
          </TableRow>
        ))}
        <TableRow className="border-t">
          <TableCell className="font-medium">Total Allowances</TableCell>
          <TableCell className="text-right font-medium" style={positiveStyle}>+{formatCurrency(result.totalAllowances)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

export function NationalInsuranceBands({ result }: PayrollBreakdownProps) {
  // Only show if we have values in at least one of these bands
  const hasBandValues = result.earningsAtLEL > 0 || result.earningsLELtoPT > 0 || 
                        result.earningsPTtoUEL > 0 || result.earningsAboveUEL > 0;

  if (!hasBandValues) {
    return null;
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">National Insurance Bands</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Band</TableHead>
            <TableHead className="text-right">Earnings</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.earningsAtLEL > 0 && (
            <TableRow>
              <TableCell>Earnings at LEL</TableCell>
              <TableCell className="text-right">{formatCurrency(result.earningsAtLEL)}</TableCell>
            </TableRow>
          )}
          {result.earningsLELtoPT > 0 && (
            <TableRow>
              <TableCell>LEL to Primary Threshold (PT)</TableCell>
              <TableCell className="text-right">{formatCurrency(result.earningsLELtoPT)}</TableCell>
            </TableRow>
          )}
          {result.earningsPTtoUEL > 0 && (
            <TableRow>
              <TableCell>PT to Upper Earnings Limit (UEL)</TableCell>
              <TableCell className="text-right">{formatCurrency(result.earningsPTtoUEL)}</TableCell>
            </TableRow>
          )}
          {result.earningsAboveUEL > 0 && (
            <TableRow>
              <TableCell>Above UEL</TableCell>
              <TableCell className="text-right">{formatCurrency(result.earningsAboveUEL)}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function NetPaySummary({ result }: PayrollBreakdownProps) {
  const brandColors = useBrandColors();
  
  return (
    <div 
      className="p-4 rounded-md"
      style={{ backgroundColor: `hsl(${brandColors.positiveLight})` }}
    >
      <div className="flex justify-between items-center">
        <span className="font-bold text-lg">Net Pay</span>
        <span 
          className="font-bold text-lg"
          style={{ color: `hsl(${brandColors.positive})` }}
        >
          {formatCurrency(result.netPay)}
        </span>
      </div>
    </div>
  );
}
