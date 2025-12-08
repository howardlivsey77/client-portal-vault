import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { useHmrcDashboardData, HmrcPeriodData } from "@/hooks";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function generateFinancialYears(): string[] {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  // Financial year starts in April (month 3)
  const currentFinancialYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  
  // Generate 3 years: previous, current, next
  return [
    `${currentFinancialYear - 1}/${(currentFinancialYear).toString().slice(-2)}`,
    `${currentFinancialYear}/${(currentFinancialYear + 1).toString().slice(-2)}`,
    `${currentFinancialYear + 1}/${(currentFinancialYear + 2).toString().slice(-2)}`,
  ];
}

// Example status data for display purposes
function getExampleStatus(period: number): { fpsStatus: HmrcPeriodData['fpsStatus'], epsStatus: HmrcPeriodData['epsStatus'] } {
  const currentMonth = new Date().getMonth();
  const currentPeriod = currentMonth >= 3 ? currentMonth - 2 : currentMonth + 10;
  
  if (period > currentPeriod) {
    // Future periods - no status
    return { fpsStatus: null, epsStatus: null };
  }
  
  // Example statuses for past/current periods
  const exampleStatuses: { [key: number]: { fpsStatus: HmrcPeriodData['fpsStatus'], epsStatus: HmrcPeriodData['epsStatus'] } } = {
    1: { fpsStatus: 'success', epsStatus: 'not_required' },
    2: { fpsStatus: 'success', epsStatus: 'not_required' },
    3: { fpsStatus: 'success', epsStatus: 'not_required' },
    4: { fpsStatus: 'success', epsStatus: 'success' },
    5: { fpsStatus: 'success', epsStatus: 'not_required' },
    6: { fpsStatus: 'success', epsStatus: 'not_required' },
    7: { fpsStatus: 'failed', epsStatus: 'pending' },
    8: { fpsStatus: 'pending', epsStatus: 'not_required' },
    9: { fpsStatus: 'success', epsStatus: 'success' },
    10: { fpsStatus: 'success', epsStatus: 'not_required' },
    11: { fpsStatus: 'success', epsStatus: 'not_required' },
    12: { fpsStatus: 'success', epsStatus: 'success' },
  };
  
  return exampleStatuses[period] || { fpsStatus: null, epsStatus: null };
}

function StatusIndicator({ status }: { status: HmrcPeriodData['fpsStatus'] }) {
  const getStatusStyles = () => {
    switch (status) {
      case 'success':
        return 'bg-green-500 shadow-[0_0_6px_1px_rgba(34,197,94,0.4)]';
      case 'failed':
        return 'bg-red-500 shadow-[0_0_6px_1px_rgba(239,68,68,0.4)]';
      case 'pending':
        return 'bg-amber-500 shadow-[0_0_6px_1px_rgba(245,158,11,0.4)]';
      case 'not_required':
        return 'bg-muted-foreground/30';
      default:
        return 'bg-muted-foreground/20';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'success': return 'Submitted successfully';
      case 'failed': return 'Submission failed';
      case 'pending': return 'Pending submission';
      case 'not_required': return 'Not required';
      default: return 'No submission';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`w-2.5 h-2.5 rounded-full ${getStatusStyles()} transition-all`}
            aria-label={getStatusLabel()}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{getStatusLabel()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function HmrcDashboardCard() {
  const financialYears = useMemo(() => generateFinancialYears(), []);
  const [selectedYear, setSelectedYear] = useState(financialYears[1]); // Default to current year
  
  const { data: periodData, isLoading } = useHmrcDashboardData(selectedYear);

  // Apply example statuses when no real data exists
  const displayData = useMemo(() => {
    if (!periodData) return null;
    return periodData.map(period => {
      // If no real FPS/EPS status, use example data
      if (!period.fpsStatus && !period.epsStatus) {
        const exampleStatus = getExampleStatus(period.period);
        return {
          ...period,
          fpsStatus: exampleStatus.fpsStatus,
          epsStatus: exampleStatus.epsStatus,
        };
      }
      return period;
    });
  }, [periodData]);

  const totals = useMemo(() => {
    if (!displayData) return { payments: 0, credits: 0 };
    return displayData.reduce(
      (acc, period) => ({
        payments: acc.payments + period.payments,
        credits: acc.credits + period.credits,
      }),
      { payments: 0, credits: 0 }
    );
  }, [displayData]);

  return (
    <Card className="animate-fade-in border-[1.5px] border-foreground">
      <CardContent className="pt-4 pb-3 px-4">
        {/* Header with title, year selector, and net due */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              HMRC
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px] h-7 text-xs">
                <SelectValue placeholder="Year" />
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

        {/* HMRC Grid */}
        {isLoading ? (
          <div className="flex justify-center py-3 text-muted-foreground text-xs">
            Loading...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1.5 px-2 font-medium text-muted-foreground">Period</th>
                  <th className="text-right py-1.5 px-2 font-medium text-muted-foreground">Payments</th>
                  <th className="text-right py-1.5 px-2 font-medium text-muted-foreground">Credits</th>
                  <th className="text-center py-1.5 px-2 font-medium text-muted-foreground">FPS</th>
                  <th className="text-center py-1.5 px-2 font-medium text-muted-foreground">EPS</th>
                </tr>
              </thead>
              <tbody>
                {displayData?.map((period) => (
                  <tr 
                    key={period.period} 
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-1.5 px-2 font-medium">{period.periodLabel}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">
                      {period.payments > 0 ? formatCurrency(period.payments) : '—'}
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-green-600 dark:text-green-400">
                      {period.credits > 0 ? formatCurrency(period.credits) : '—'}
                    </td>
                    <td className="py-1.5 px-2">
                      <div className="flex justify-center">
                        <StatusIndicator status={period.fpsStatus} />
                      </div>
                    </td>
                    <td className="py-1.5 px-2">
                      <div className="flex justify-center">
                        <StatusIndicator status={period.epsStatus} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-foreground/30 font-semibold">
                  <td className="py-1.5 px-2">Total</td>
                  <td className="py-1.5 px-2 text-right tabular-nums">
                    {formatCurrency(totals.payments)}
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums text-green-600 dark:text-green-400">
                    {formatCurrency(totals.credits)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
