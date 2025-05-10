
import { PayrollResult } from "@/services/payroll/types";
import { PayrollResultsContainer } from "./results/PayrollResultsContainer";

interface PayrollResultsProps {
  result: PayrollResult;
  payPeriod: string;
  onClearResults?: () => Promise<void>;
}

export function PayrollResults({ result, payPeriod, onClearResults }: PayrollResultsProps) {
  return <PayrollResultsContainer result={result} payPeriod={payPeriod} onClearResults={onClearResults} />;
}
