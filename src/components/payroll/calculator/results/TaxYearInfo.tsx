
import { PayrollResult } from "@/services/payroll/types";

interface TaxYearInfoProps {
  result: PayrollResult;
}

export function TaxYearInfo({ result }: TaxYearInfoProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-md mt-4">
      <h3 className="text-md font-medium mb-1">UK Tax Year Information</h3>
      <div className="text-sm text-muted-foreground">
        <p>Tax Year: {result.taxYear} (6 Apr to 5 Apr)</p>
        <p>Tax Period: {result.taxPeriod} of 12</p>
        {result.taxCode.includes('M1') && (
          <p className="text-amber-600 mt-1">
            Emergency tax basis (Month 1) is being applied. Each period is calculated in isolation.
          </p>
        )}
      </div>
    </div>
  );
}
