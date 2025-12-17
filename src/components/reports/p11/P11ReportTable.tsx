import { P11PeriodData } from "@/hooks/reports/useP11Report";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";

interface P11ReportTableProps {
  periods: P11PeriodData[];
}

export function P11ReportTable({ periods }: P11ReportTableProps) {
  // Create array of 12 periods for the full tax year
  const fullYearPeriods = Array.from({ length: 12 }, (_, i) => {
    const periodNum = i + 1;
    const existingPeriod = periods.find((p) => p.taxPeriod === periodNum);
    return existingPeriod || {
      taxPeriod: periodNum,
      periodStartDate: null,
      periodEndDate: null,
      nicLetter: "",
      earningsAtLEL: 0,
      earningsLELtoPT: 0,
      earningsPTtoUEL: 0,
      earningsAboveUEL: 0,
      employeeNIC: 0,
      employerNIC: 0,
      taxCode: "",
      grossPay: 0,
      taxablePay: 0,
      incomeTax: 0,
      employeePension: 0,
      studentLoan: 0,
      nhsPensionEmployee: 0,
    };
  });

  // Calculate running totals
  const runningTotals = {
    earningsAtLEL: 0,
    earningsLELtoPT: 0,
    earningsPTtoUEL: 0,
    earningsAboveUEL: 0,
    employeeNIC: 0,
    employerNIC: 0,
    grossPay: 0,
    taxablePay: 0,
    incomeTax: 0,
    employeePension: 0,
    studentLoan: 0,
  };

  fullYearPeriods.forEach((period) => {
    runningTotals.earningsAtLEL += period.earningsAtLEL;
    runningTotals.earningsLELtoPT += period.earningsLELtoPT;
    runningTotals.earningsPTtoUEL += period.earningsPTtoUEL;
    runningTotals.earningsAboveUEL += period.earningsAboveUEL;
    runningTotals.employeeNIC += period.employeeNIC;
    runningTotals.employerNIC += period.employerNIC;
    runningTotals.grossPay += period.grossPay;
    runningTotals.taxablePay += period.taxablePay;
    runningTotals.incomeTax += period.incomeTax;
    runningTotals.employeePension += period.employeePension;
    runningTotals.studentLoan += period.studentLoan;
  });

  const formatValue = (value: number) => {
    if (value === 0) return "-";
    return formatCurrency(value / 100);
  };

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-16 text-center">Period</TableHead>
            <TableHead className="w-12 text-center">NI Letter</TableHead>
            <TableHead className="text-right">Earnings at LEL</TableHead>
            <TableHead className="text-right">LEL to PT</TableHead>
            <TableHead className="text-right">PT to UEL</TableHead>
            <TableHead className="text-right">Above UEL</TableHead>
            <TableHead className="text-right">Employee NIC</TableHead>
            <TableHead className="text-right">Employer NIC</TableHead>
            <TableHead className="w-16 text-center">Tax Code</TableHead>
            <TableHead className="text-right">Gross Pay</TableHead>
            <TableHead className="text-right">Tax</TableHead>
            <TableHead className="text-right">Pension</TableHead>
            <TableHead className="text-right">Student Loan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fullYearPeriods.map((period) => {
            const hasData = period.grossPay > 0 || period.incomeTax > 0;
            return (
              <TableRow 
                key={period.taxPeriod} 
                className={hasData ? "" : "text-muted-foreground"}
              >
                <TableCell className="text-center font-medium">{period.taxPeriod}</TableCell>
                <TableCell className="text-center">{period.nicLetter || "-"}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatValue(period.earningsAtLEL)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatValue(period.earningsLELtoPT)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatValue(period.earningsPTtoUEL)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatValue(period.earningsAboveUEL)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatValue(period.employeeNIC)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatValue(period.employerNIC)}</TableCell>
                <TableCell className="text-center">{period.taxCode || "-"}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatValue(period.grossPay)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatValue(period.incomeTax)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatValue(period.employeePension)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{formatValue(period.studentLoan)}</TableCell>
              </TableRow>
            );
          })}
          <TableRow className="bg-muted/50 font-semibold">
            <TableCell className="text-center">Total</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right font-mono text-sm">{formatValue(runningTotals.earningsAtLEL)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatValue(runningTotals.earningsLELtoPT)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatValue(runningTotals.earningsPTtoUEL)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatValue(runningTotals.earningsAboveUEL)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatValue(runningTotals.employeeNIC)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatValue(runningTotals.employerNIC)}</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right font-mono text-sm">{formatValue(runningTotals.grossPay)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatValue(runningTotals.incomeTax)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatValue(runningTotals.employeePension)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatValue(runningTotals.studentLoan)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
