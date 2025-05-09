
import { formatCurrency } from "@/lib/formatters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PayrollResult } from "@/services/payroll/types";

interface DeductionsTableProps {
  result: PayrollResult;
}

export function DeductionsTable({ result }: DeductionsTableProps) {
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

  // Check if the tax code has specific indicators
  const isEmergencyTaxCode = result.taxCode?.includes('M1');
  const isScottishTaxCode = result.taxCode?.startsWith('S');
  const isBRTaxCode = result.taxCode === 'BR';
  const isNTTaxCode = result.taxCode === 'NT';
  
  // For period 1, YTD should equal period values
  const isPeriod1 = result.taxPeriod === 1;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Deductions</TableHead>
          <TableHead className="text-right">This Period</TableHead>
          <TableHead className="text-right">Year To Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>
            Income Tax
            <div className="text-xs text-muted-foreground mt-1">
              {isEmergencyTaxCode && "Emergency tax code applied"}
              {isScottishTaxCode && "Scottish tax rates applied"}
              {isBRTaxCode && "Basic rate applied to all income"}
              {isNTTaxCode && "No tax deducted"}
            </div>
          </TableCell>
          <TableCell className="text-right text-red-500">-{formatCurrency(result.incomeTax)}</TableCell>
          <TableCell className="text-right text-red-500">
            -{formatCurrency(isPeriod1 ? result.incomeTax : result.incomeTaxYTD)}
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>National Insurance</TableCell>
          <TableCell className="text-right text-red-500">-{formatCurrency(result.nationalInsurance)}</TableCell>
          <TableCell className="text-right text-red-500">
            -{formatCurrency(isPeriod1 ? result.nationalInsurance : result.nationalInsuranceYTD)}
          </TableCell>
        </TableRow>
        {result.studentLoan > 0 && (
          <TableRow>
            <TableCell>Student Loan ({getStudentLoanPlanName(result.studentLoanPlan)})</TableCell>
            <TableCell className="text-right text-red-500">-{formatCurrency(result.studentLoan)}</TableCell>
            <TableCell className="text-right text-red-500">-{formatCurrency(result.studentLoan)}</TableCell>
          </TableRow>
        )}
        {result.pensionContribution > 0 && (
          <TableRow>
            <TableCell>Pension Contribution ({result.pensionPercentage}%)</TableCell>
            <TableCell className="text-right text-red-500">-{formatCurrency(result.pensionContribution)}</TableCell>
            <TableCell className="text-right text-red-500">-{formatCurrency(result.pensionContribution)}</TableCell>
          </TableRow>
        )}
        {result.additionalDeductions && result.additionalDeductions.length > 0 && result.additionalDeductions.map((deduction, index) => (
          <TableRow key={`deduction-${index}`}>
            <TableCell>{deduction.name}</TableCell>
            <TableCell className="text-right text-red-500">-{formatCurrency(deduction.amount)}</TableCell>
            <TableCell className="text-right text-red-500">-{formatCurrency(deduction.amount)}</TableCell>
          </TableRow>
        ))}
        <TableRow className="border-t">
          <TableCell className="font-medium">Total Deductions</TableCell>
          <TableCell className="text-right font-medium text-red-500">-{formatCurrency(result.totalDeductions)}</TableCell>
          <TableCell className="text-right font-medium text-red-500">
            -{formatCurrency(isPeriod1 ? result.totalDeductions : (result.incomeTaxYTD + result.nationalInsuranceYTD + result.studentLoan + result.pensionContribution))}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
