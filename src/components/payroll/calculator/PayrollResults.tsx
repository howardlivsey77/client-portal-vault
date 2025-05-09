
import { PayrollResults as PayrollResultsComponent } from './results/PayrollResults';
import { PayrollResult } from "@/services/payroll/types";

interface PayrollResultsProps {
  result: PayrollResult;
  payPeriod: string;
}

export function PayrollResults({ result, payPeriod }: PayrollResultsProps) {
  // The period should now be consistently "April 2025 (Period 1)"
  return <PayrollResultsComponent result={result} payPeriod={payPeriod} />;
}
