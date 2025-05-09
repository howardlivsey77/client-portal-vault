
import { PayrollResult } from "@/services/payroll/types";
import { PayrollSummary } from "./PayrollSummary";
import { GrossPayTable } from "./GrossPayTable";
import { DeductionsTable } from "./DeductionsTable";
import { AllowancesTable } from "./AllowancesTable";
import { PaySummary } from "./PaySummary";
import { TaxYearInfo } from "./TaxYearInfo";

interface PayrollResultsProps {
  result: PayrollResult;
  payPeriod: string;
}

export function PayrollResults({ result, payPeriod }: PayrollResultsProps) {
  return (
    <div className="space-y-4">
      <PayrollSummary result={result} payPeriod={payPeriod} />
      <GrossPayTable result={result} />
      <DeductionsTable result={result} />
      <AllowancesTable result={result} />
      <PaySummary result={result} />
      <TaxYearInfo result={result} />
    </div>
  );
}
