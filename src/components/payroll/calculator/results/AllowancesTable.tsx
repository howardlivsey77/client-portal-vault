
import { formatCurrency } from "@/lib/formatters";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PayrollResult } from "@/services/payroll/types";

interface AllowancesTableProps {
  result: PayrollResult;
}

export function AllowancesTable({ result }: AllowancesTableProps) {
  // Only render if there are allowances
  if (!result.additionalAllowances || result.additionalAllowances.length === 0) {
    return null;
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Allowances</TableHead>
          <TableHead className="text-right">This Period</TableHead>
          <TableHead className="text-right">Year To Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {result.additionalAllowances.map((allowance, index) => (
          <TableRow key={`allowance-${index}`}>
            <TableCell>{allowance.name}</TableCell>
            <TableCell className="text-right text-green-500">+{formatCurrency(allowance.amount)}</TableCell>
            <TableCell className="text-right text-green-500">+{formatCurrency(allowance.amount)}</TableCell>
          </TableRow>
        ))}
        <TableRow className="border-t">
          <TableCell className="font-medium">Total Allowances</TableCell>
          <TableCell className="text-right font-medium text-green-500">+{formatCurrency(result.totalAllowances)}</TableCell>
          <TableCell className="text-right font-medium text-green-500">+{formatCurrency(result.totalAllowances)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
