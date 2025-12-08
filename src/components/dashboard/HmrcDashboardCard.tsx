import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, Building2 } from "lucide-react";
import { useHmrcDashboardData, HmrcPeriodData } from "@/hooks/useHmrcDashboardData";
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

function StatusIndicator({ status }: { status: HmrcPeriodData['fpsStatus'] }) {
  const getStatusStyles = () => {
    switch (status) {
      case 'success':
        return 'bg-green-500 shadow-[0_0_8px_2px_rgba(34,197,94,0.4)]';
      case 'failed':
        return 'bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.4)]';
      case 'pending':
        return 'bg-amber-500 shadow-[0_0_8px_2px_rgba(245,158,11,0.4)]';
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
            className={`w-3 h-3 rounded-full ${getStatusStyles()} transition-all`}
            aria-label={getStatusLabel()}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{getStatusLabel()}</p>
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
  const [isOpen, setIsOpen] = useState(false);
  const financialYears = useMemo(() => generateFinancialYears(), []);
  const [selectedYear, setSelectedYear] = useState(financialYears[1]); // Default to current year
  
  const { data: periodData, isLoading } = useHmrcDashboardData(selectedYear);

  const totals = useMemo(() => {
    if (!periodData) return { payments: 0, credits: 0 };
    return periodData.reduce(
      (acc, period) => ({
        payments: acc.payments + period.payments,
        credits: acc.credits + period.credits,
      }),
      { payments: 0, credits: 0 }
    );
  }, [periodData]);

  return (
    <Card className="animate-fade-in border-[1.5px] border-foreground">
      <CardContent className="pt-6">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                HMRC
              </h3>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-lg font-bold">{formatCurrency(totals.payments - totals.credits)}</span>
                <span className="text-xs text-muted-foreground">Net Due</span>
                <ChevronDown 
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`} 
                />
              </div>
            </button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-4">
            <div className="space-y-4">
              {/* Financial Year Selector */}
              <div className="flex justify-end">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {financialYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* HMRC Grid */}
              {isLoading ? (
                <div className="flex justify-center py-4 text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">Period</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Payments</th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">Credits</th>
                        <th className="text-center py-2 px-3 font-medium text-muted-foreground">FPS</th>
                        <th className="text-center py-2 px-3 font-medium text-muted-foreground">EPS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periodData?.map((period) => (
                        <tr 
                          key={period.period} 
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-2 px-3 font-medium">{period.periodLabel}</td>
                          <td className="py-2 px-3 text-right tabular-nums">
                            {period.payments > 0 ? formatCurrency(period.payments) : '—'}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums text-green-600 dark:text-green-400">
                            {period.credits > 0 ? formatCurrency(period.credits) : '—'}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex justify-center">
                              <StatusIndicator status={period.fpsStatus} />
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex justify-center">
                              <StatusIndicator status={period.epsStatus} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border font-semibold">
                        <td className="py-2 px-3">Total</td>
                        <td className="py-2 px-3 text-right tabular-nums">
                          {formatCurrency(totals.payments)}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums text-green-600 dark:text-green-400">
                          {formatCurrency(totals.credits)}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
