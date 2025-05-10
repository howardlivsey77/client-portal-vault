
import { PayrollResult } from "@/services/payroll/types";
import { PayrollResultsContainer } from "./results/PayrollResultsContainer";

interface PayrollResultsProps {
  result: PayrollResult;
  payPeriod: string;
}

export function PayrollResults({ result, payPeriod }: PayrollResultsProps) {
  return <PayrollResultsContainer result={result} payPeriod={payPeriod} />;
}
