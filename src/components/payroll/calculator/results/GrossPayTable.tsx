
import { PayrollResult } from "@/services/payroll/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";

interface GrossPayTableProps {
  result: PayrollResult;
}

export function GrossPayTable({ result }: GrossPayTableProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Monthly Earnings</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70%]">Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Basic Salary</TableCell>
              <TableCell className="text-right font-medium">£{formatCurrency(result.monthlySalary)}</TableCell>
            </TableRow>
            {result.additionalEarnings && result.additionalEarnings.map((earning, index) => (
              <TableRow key={index}>
                <TableCell>{earning.name}</TableCell>
                <TableCell className="text-right font-medium">£{formatCurrency(earning.amount)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-bold">Total Gross Pay</TableCell>
              <TableCell className="text-right font-bold">£{formatCurrency(result.grossPay)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
