
import { Card, CardContent } from "@/components/ui/card";
import { PayrollResult } from "@/services/payroll/types";
import { formatCurrency } from "@/lib/formatters";

interface PayrollSummaryProps {
  result: PayrollResult;
  payPeriod?: string; // Make payPeriod optional
}

export function PayrollSummary({ result, payPeriod }: PayrollSummaryProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">Gross Pay:</div>
          <div className="text-right">{formatCurrency(result.grossPay)}</div>
          
          <div className="font-medium">Tax-Free Amount:</div>
          <div className="text-right">{formatCurrency(result.taxFreeAmount)}</div>
          
          <div className="font-medium">Income Tax:</div>
          <div className="text-right">{formatCurrency(result.incomeTax)}</div>
          
          <div className="font-medium">National Insurance:</div>
          <div className="text-right">{formatCurrency(result.nationalInsurance)}</div>
          
          {result.studentLoan > 0 && (
            <>
              <div className="font-medium">Student Loan:</div>
              <div className="text-right">{formatCurrency(result.studentLoan)}</div>
            </>
          )}
          
          {result.pensionContribution > 0 && (
            <>
              <div className="font-medium">Pension ({result.pensionPercentage}%):</div>
              <div className="text-right">{formatCurrency(result.pensionContribution)}</div>
            </>
          )}
          
          <div className="border-t border-gray-200 col-span-2 my-1"></div>
          
          <div className="font-medium text-base">Net Pay:</div>
          <div className="text-right font-bold text-base">{formatCurrency(result.netPay)}</div>
          
          {payPeriod && (
            <div className="col-span-2 text-xs text-gray-500 mt-2">
              Payment period: {payPeriod}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
