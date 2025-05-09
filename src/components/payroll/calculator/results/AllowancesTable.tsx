
import { PayrollResult } from "@/services/payroll/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";

interface AllowancesTableProps {
  result: PayrollResult;
}

export function AllowancesTable({ result }: AllowancesTableProps) {
  // If there are no additional allowances, return nothing
  if (!result.additionalAllowances || result.additionalAllowances.length === 0) {
    return null;
  }
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Additional Allowances</CardTitle>
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
            {result.additionalAllowances.map((allowance, index) => (
              <TableRow key={index}>
                <TableCell>{allowance.description}</TableCell>
                <TableCell className="text-right font-medium">£{formatCurrency(allowance.amount)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-bold">Total Allowances</TableCell>
              <TableCell className="text-right font-bold">£{formatCurrency(result.totalAllowances)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
