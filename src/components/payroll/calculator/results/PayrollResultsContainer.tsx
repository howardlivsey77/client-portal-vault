
import { PayrollResult } from "@/services/payroll/types";
import { PayrollSummary } from "./PayrollSummary";
import { TaxFreeAllowance } from "./TaxFreeAllowance";
import { GrossPayBreakdown, DeductionsBreakdown, AllowancesBreakdown, NetPaySummary } from "./PayrollBreakdown";

interface PayrollResultsContainerProps {
  result: PayrollResult;
  payPeriod: string;
}

export function PayrollResultsContainer({ result, payPeriod }: PayrollResultsContainerProps) {
  return (
    <div className="space-y-4">
      <PayrollSummary result={result} payPeriod={payPeriod} />
      <TaxFreeAllowance result={result} />
      <GrossPayBreakdown result={result} />
      <DeductionsBreakdown result={result} />
      <AllowancesBreakdown result={result} />
      <NetPaySummary result={result} />
    </div>
  );
}
