
import { PayrollResult } from "@/services/payroll/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";

interface PayrollSummaryProps {
  result: PayrollResult;
  showTaxYTD?: boolean;
}

export function PayrollSummary({ result, showTaxYTD = false }: PayrollSummaryProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Payroll Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[70%]">Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              {showTaxYTD && <TableHead className="text-right">YTD</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Total Gross Pay</TableCell>
              <TableCell className="text-right">£{formatCurrency(result.grossPay)}</TableCell>
              {showTaxYTD && (
                <TableCell className="text-right">
                  £{formatCurrency(result.grossPayYTD || result.grossPay)}
                </TableCell>
              )}
            </TableRow>
            <TableRow>
              <TableCell>Tax-Free Amount</TableCell>
              <TableCell className="text-right">£{formatCurrency(result.taxFreeAmount)}</TableCell>
              {showTaxYTD && <TableCell className="text-right">-</TableCell>}
            </TableRow>
            <TableRow>
              <TableCell>Taxable Pay</TableCell>
              <TableCell className="text-right">£{formatCurrency(result.taxablePay)}</TableCell>
              {showTaxYTD && (
                <TableCell className="text-right">
                  £{formatCurrency(result.taxablePayYTD || result.taxablePay)}
                </TableCell>
              )}
            </TableRow>
            <TableRow>
              <TableCell>Total Deductions</TableCell>
              <TableCell className="text-right">£{formatCurrency(result.totalDeductions)}</TableCell>
              {showTaxYTD && <TableCell className="text-right">-</TableCell>}
            </TableRow>
            <TableRow>
              <TableCell className="font-bold">Net Pay</TableCell>
              <TableCell className="text-right font-bold">£{formatCurrency(result.netPay)}</TableCell>
              {showTaxYTD && <TableCell className="text-right">-</TableCell>}
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
