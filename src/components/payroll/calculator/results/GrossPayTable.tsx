
import { formatCurrency } from "@/lib/formatters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PayrollResult } from "@/services/payroll/types";

interface GrossPayTableProps {
  result: PayrollResult;
}

export function GrossPayTable({ result }: GrossPayTableProps) {
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
              <TableCell>{earning.name}</TableCell>
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
