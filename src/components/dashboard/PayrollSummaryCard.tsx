import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePayrollSummaryData } from "@/hooks/usePayrollSummaryData";
import { useState } from "react";

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

function getCurrentTaxPeriod(): number {
  const now = new Date();
  const month = now.getMonth();
  // April = period 1, May = period 2, etc.
  return month >= 3 ? month - 2 : month + 10;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function PayrollSummaryCard() {
  const financialYears = generateFinancialYears();
  const [selectedYear, setSelectedYear] = useState(financialYears[1]);
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentTaxPeriod());
  
  const { data, isLoading } = usePayrollSummaryData(selectedYear, selectedPeriod);

  const periods = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Card className="monday-card pt-4">
      <CardHeader className="pb-3 pt-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Payroll Summary</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-7 w-[80px] text-xs">
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
            <Select value={selectedPeriod.toString()} onValueChange={(v) => setSelectedPeriod(Number(v))}>
              <SelectTrigger className="h-7 w-[70px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period} value={period.toString()} className="text-xs">
                    P{period}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {data?.periodLabel && (
          <p className="text-xs text-muted-foreground mt-1">{data.periodLabel}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="text-xs text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Gross Pay</p>
                <p className="text-lg font-semibold">{formatCurrency(data?.totalGross || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Income Tax</p>
                <p className="text-lg font-semibold">{formatCurrency(data?.totalTax || 0)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Employee NIC</p>
                <p className="text-lg font-semibold">{formatCurrency(data?.totalNicEmployee || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Employer NIC</p>
                <p className="text-lg font-semibold">{formatCurrency(data?.totalNicEmployer || 0)}</p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">Employees Processed</p>
                <p className="text-sm font-medium">{data?.employeeCount || 0}</p>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-muted-foreground font-medium">Total Deductions</p>
                <p className="text-sm font-semibold text-primary">
                  {formatCurrency((data?.totalTax || 0) + (data?.totalNicEmployee || 0) + (data?.totalNicEmployer || 0))}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
