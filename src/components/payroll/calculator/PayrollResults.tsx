
import { formatCurrency } from "@/lib/formatters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PayrollResult } from "@/services/payroll/types";

interface PayrollResultsProps {
  result: PayrollResult;
  payPeriod: string;
}

export function PayrollResults({ result, payPeriod }: PayrollResultsProps) {
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
            <TableCell className="text-right">{formatCurrency(result.grossPay)}</TableCell>
          </TableRow>
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
              <TableCell>Student Loan</TableCell>
              <TableCell className="text-right text-red-500">-{formatCurrency(result.studentLoan)}</TableCell>
            </TableRow>
          )}
          {result.pensionContribution > 0 && (
            <TableRow>
              <TableCell>Pension Contribution</TableCell>
              <TableCell className="text-right text-red-500">-{formatCurrency(result.pensionContribution)}</TableCell>
            </TableRow>
          )}
          {result.additionalDeductions.map((deduction, index) => (
            <TableRow key={`deduction-${index}`}>
              <TableCell>{deduction.description}</TableCell>
              <TableCell className="text-right text-red-500">-{formatCurrency(deduction.amount)}</TableCell>
            </TableRow>
          ))}
          {result.additionalAllowances.map((allowance, index) => (
            <TableRow key={`allowance-${index}`}>
              <TableCell>{allowance.description}</TableCell>
              <TableCell className="text-right text-green-500">+{formatCurrency(allowance.amount)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2">
            <TableCell className="font-bold">Net Pay</TableCell>
            <TableCell className="text-right font-bold text-green-600">{formatCurrency(result.netPay)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
