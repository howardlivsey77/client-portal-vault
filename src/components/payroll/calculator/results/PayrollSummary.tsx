
import { PayrollResult } from "@/services/payroll/types";
import { Card, CardContent } from "@/components/ui/card";

export interface PayrollSummaryProps {
  result: PayrollResult;
  payPeriod: string;
}

export function PayrollSummary({ result, payPeriod }: PayrollSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Employee</h3>
            <p className="font-bold text-xl">{result.employeeName}</p>
            <p className="text-gray-600">
              ID: {result.employeeId}
              {result.payrollId && ` (Payroll: ${result.payrollId})`}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Tax code: <span className="font-semibold">{result.taxCode}</span>
            </p>
          </div>

          <div className="text-right">
            <h3 className="text-lg font-medium mb-2">Pay Summary</h3>
            <p className="font-bold text-xl">{formatCurrency(result.netPay)}</p>
            <p className="text-gray-600">Net pay for {payPeriod}</p>
            <p className="mt-1 text-sm text-gray-600">
              Tax Year: <span className="font-semibold">{result.taxYear}</span> 
              {result.taxPeriod && ` (Period ${result.taxPeriod})`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
