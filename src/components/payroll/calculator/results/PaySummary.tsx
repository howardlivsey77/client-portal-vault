
import { formatCurrency } from "@/lib/formatters";
import { PayrollResult } from "@/services/payroll/types";

interface PaySummaryProps {
  result: PayrollResult;
}

export function PaySummary({ result }: PaySummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-md">
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg">This Period Net Pay</span>
          <span className="font-bold text-lg text-green-600">{formatCurrency(result.netPay)}</span>
        </div>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-md">
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium">YTD Gross Pay</span>
            <span className="font-medium">{formatCurrency(result.grossPayYTD || result.grossPay)}</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium">YTD Deductions</span>
            <span className="font-medium text-red-500">-{formatCurrency((result.incomeTaxYTD || result.incomeTax) + (result.nationalInsuranceYTD || result.nationalInsurance))}</span>
          </div>
          <div className="border-t mt-1 pt-1 flex justify-between items-center">
            <span className="font-bold">YTD Net Pay</span>
            <span className="font-bold text-green-600">{formatCurrency(result.netPay)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
