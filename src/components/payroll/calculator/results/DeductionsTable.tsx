
import { PayrollResult } from "@/services/payroll/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";

interface DeductionsTableProps {
  result: PayrollResult;
  showTaxYTD?: boolean;
}

export function DeductionsTable({ result, showTaxYTD = false }: DeductionsTableProps) {
  // Format student loan plan if it exists
  const studentLoanPlanLabel = result.studentLoanPlan 
    ? `Student Loan (Plan ${result.studentLoanPlan})` 
    : 'Student Loan';
  
  // Calculate rate for Pension
  const pensionRate = result.pensionPercentage > 0 
    ? `(${result.pensionPercentage}%)` 
    : '';
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Monthly Deductions</CardTitle>
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
              <TableCell>Income Tax</TableCell>
              <TableCell className="text-right">£{formatCurrency(result.incomeTax)}</TableCell>
              {showTaxYTD && (
                <TableCell className="text-right">
                  £{formatCurrency(result.incomeTaxYTD || result.incomeTax)}
                </TableCell>
              )}
            </TableRow>
            <TableRow>
              <TableCell>National Insurance</TableCell>
              <TableCell className="text-right">£{formatCurrency(result.nationalInsurance)}</TableCell>
              {showTaxYTD && (
                <TableCell className="text-right">
                  £{formatCurrency(result.nationalInsuranceYTD || result.nationalInsurance)}
                </TableCell>
              )}
            </TableRow>
            {result.studentLoan > 0 && (
              <TableRow>
                <TableCell>{studentLoanPlanLabel}</TableCell>
                <TableCell className="text-right">£{formatCurrency(result.studentLoan)}</TableCell>
                {showTaxYTD && (
                  <TableCell className="text-right">
                    £{formatCurrency(result.studentLoanYTD || result.studentLoan)}
                  </TableCell>
                )}
              </TableRow>
            )}
            {result.pensionContribution > 0 && (
              <TableRow>
                <TableCell>Pension Contribution {pensionRate}</TableCell>
                <TableCell className="text-right">£{formatCurrency(result.pensionContribution)}</TableCell>
                {showTaxYTD && <TableCell className="text-right">-</TableCell>}
              </TableRow>
            )}
            {result.additionalDeductions?.map((deduction, index) => (
              <TableRow key={index}>
                <TableCell>{deduction.description}</TableCell>
                <TableCell className="text-right">£{formatCurrency(deduction.amount)}</TableCell>
                {showTaxYTD && <TableCell className="text-right">-</TableCell>}
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-bold">Total Deductions</TableCell>
              <TableCell className="text-right font-bold">£{formatCurrency(result.totalDeductions)}</TableCell>
              {showTaxYTD && <TableCell className="text-right font-bold">-</TableCell>}
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
