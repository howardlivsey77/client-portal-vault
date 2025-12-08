import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePayrollSummaryData } from "@/hooks/usePayrollSummaryData";
import { useState } from "react";
import { Coins } from "lucide-react";

function generateFinancialYears(): string[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const fiscalYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  
  const years: string[] = [];
  for (let i = -1; i <= 1; i++) {
    const startYear = fiscalYear + i;
    const endYear = (startYear + 1) % 100;
    years.push(`${startYear % 100}/${endYear.toString().padStart(2, '0')}`);
  }
  return years;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function VarianceIndicator({ variance }: { variance: number | null }) {
  if (variance === null || variance === 0) return null;
  
  if (variance > 0) {
    return <span className="text-red-500 ml-1 text-[10px]">▲</span>;
  }
  return <span className="text-foreground ml-1 text-[10px]">▼</span>;
}

export function PayrollSummaryCard() {
  const financialYears = generateFinancialYears();
  const [selectedYear, setSelectedYear] = useState(financialYears[1]);
  
  const { data, isLoading } = usePayrollSummaryData(selectedYear);

  return (
    <Card className="monday-card border-[1.5px] border-foreground">
      <CardContent className="pt-4 pb-3 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wide">Payroll Summary</h3>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-6 w-[70px] text-xs border-muted-foreground/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {financialYears.map((year) => (
                  <SelectItem key={year} value={year} className="text-xs">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-xs text-muted-foreground py-4 text-center">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-muted-foreground/20">
                  <th className="text-left font-medium text-muted-foreground py-1.5 pr-2">Period</th>
                  <th className="text-right font-medium text-muted-foreground py-1.5 px-2">Gross Pay</th>
                  <th className="text-right font-medium text-muted-foreground py-1.5 px-2">Overtime</th>
                  <th className="text-right font-medium text-muted-foreground py-1.5 pl-2">Cost to Employer</th>
                </tr>
              </thead>
              <tbody>
                {data?.periods.map((period) => {
                  const hasData = period.grossPay > 0 || period.overtimePay > 0;
                  return (
                    <tr 
                      key={period.period} 
                      className="border-b border-muted-foreground/10 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-1.5 pr-2 font-medium">{period.label}</td>
                      <td className="py-1.5 px-2 text-right">
                        {hasData ? (
                          <span className="inline-flex items-center">
                            {formatCurrency(period.grossPay)}
                            <VarianceIndicator variance={period.grossVariance} />
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        {hasData ? (
                          <span className="inline-flex items-center">
                            {formatCurrency(period.overtimePay)}
                            <VarianceIndicator variance={period.overtimeVariance} />
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-1.5 pl-2 text-right">
                        {hasData ? (
                          <span className="inline-flex items-center">
                            {formatCurrency(period.costToEmployer)}
                            <VarianceIndicator variance={period.costVariance} />
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-foreground/30 font-semibold">
                  <td className="py-2 pr-2">Total</td>
                  <td className="py-2 px-2 text-right">{formatCurrency(data?.totals.grossPay || 0)}</td>
                  <td className="py-2 px-2 text-right">{formatCurrency(data?.totals.overtimePay || 0)}</td>
                  <td className="py-2 pl-2 text-right">{formatCurrency(data?.totals.costToEmployer || 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
