
import { PayrollResults as PayrollResultsComponent } from './results/PayrollResults';
import type { PayrollResult } from "@/services/payroll/types";

interface PayrollResultsProps {
  result: PayrollResult;
  payPeriod: string;
}

export function PayrollResults({ result, payPeriod }: PayrollResultsProps) {
  return <PayrollResultsComponent result={result} payPeriod={payPeriod} />;
}
