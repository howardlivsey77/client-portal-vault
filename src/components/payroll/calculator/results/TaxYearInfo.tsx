
import { PayrollResult } from "@/services/payroll/types";

interface TaxYearInfoProps {
  result: PayrollResult;
}

export function TaxYearInfo({ result }: TaxYearInfoProps) {
  // Get month name based on tax period (1=April, 2=May, etc.)
  const getMonthName = (period: number) => {
    const months = [
      "April", "May", "June", "July", 
      "August", "September", "October", "November", 
      "December", "January", "February", "March"
    ];
    return months[period - 1] || "Unknown";
  };
  
  const monthName = getMonthName(result.taxPeriod);
  const isPeriod1 = result.taxPeriod === 1;
  
  return (
    <div className="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-md mt-4">
      <h3 className="text-md font-medium mb-1">UK Tax Year Information</h3>
      <div className="text-sm text-muted-foreground">
        <p>Tax Year: {result.taxYear} (6 Apr to 5 Apr)</p>
        <p>Tax Period: {result.taxPeriod} of 12 ({monthName})</p>
        {isPeriod1 && (
          <p className="text-blue-600 dark:text-blue-400 mt-1">
            First period of the tax year. Year-to-date figures match this period's figures.
          </p>
        )}
        {result.taxCode.includes('M1') && (
          <p className="text-amber-600 mt-1">
            Emergency tax basis (Month 1) is being applied. Each period is calculated in isolation.
          </p>
        )}
      </div>
    </div>
  );
}
