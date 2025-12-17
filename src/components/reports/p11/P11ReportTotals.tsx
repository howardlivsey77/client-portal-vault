import { P11YTDTotals } from "@/hooks/reports/useP11Report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";

interface P11ReportTotalsProps {
  ytdTotals: P11YTDTotals;
}

export function P11ReportTotals({ ytdTotals }: P11ReportTotalsProps) {
  const formatValue = (value: number) => {
    return formatCurrency(value / 100);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* NIC Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">National Insurance Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Employee NIC YTD</span>
            <span className="font-mono font-medium">{formatValue(ytdTotals.employeeNICYTD)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Employer NIC YTD</span>
            <span className="font-mono font-medium">{formatValue(ytdTotals.employerNICYTD)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="font-medium">Total NIC YTD</span>
            <span className="font-mono font-semibold">
              {formatValue(ytdTotals.employeeNICYTD + ytdTotals.employerNICYTD)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Pay & Tax Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pay & Tax Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gross Pay YTD</span>
            <span className="font-mono font-medium">{formatValue(ytdTotals.grossPayYTD)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taxable Pay YTD</span>
            <span className="font-mono font-medium">{formatValue(ytdTotals.taxablePayYTD)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Free Pay YTD</span>
            <span className="font-mono font-medium">{formatValue(ytdTotals.freePayYTD)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="font-medium">Income Tax YTD</span>
            <span className="font-mono font-semibold">{formatValue(ytdTotals.incomeTaxYTD)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Deductions Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Other Deductions Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Employee Pension YTD</span>
            <span className="font-mono font-medium">{formatValue(ytdTotals.employeePensionYTD)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Employer Pension YTD</span>
            <span className="font-mono font-medium">{formatValue(ytdTotals.employerPensionYTD)}</span>
          </div>
          {(ytdTotals.nhsPensionEmployeeYTD > 0 || ytdTotals.nhsPensionEmployerYTD > 0) && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">NHS Pension (EE) YTD</span>
                <span className="font-mono font-medium">{formatValue(ytdTotals.nhsPensionEmployeeYTD)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">NHS Pension (ER) YTD</span>
                <span className="font-mono font-medium">{formatValue(ytdTotals.nhsPensionEmployerYTD)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Student Loan YTD</span>
            <span className="font-mono font-medium">{formatValue(ytdTotals.studentLoanYTD)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="font-medium">Net Pay YTD</span>
            <span className="font-mono font-semibold">{formatValue(ytdTotals.netPayYTD)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
