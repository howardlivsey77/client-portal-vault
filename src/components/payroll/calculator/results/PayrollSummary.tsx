
import { formatCurrency } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { PayrollResult } from "@/services/payroll/types";

interface PayrollSummaryProps {
  result: PayrollResult;
  payPeriod: string;
}

export function PayrollSummary({ result, payPeriod }: PayrollSummaryProps) {
  // Check if the tax code has specific indicators
  const isEmergencyTaxCode = result.taxCode?.includes('M1');
  const isScottishTaxCode = result.taxCode?.startsWith('S');
  
  // Map student loan plan numbers to descriptive text
  const getStudentLoanPlanName = (plan: number | null) => {
    if (!plan) return "None";
    const planMap: Record<number, string> = {
      1: "Plan 1",
      2: "Plan 2",
      4: "Plan 4",
      5: "Plan 5"
    };
    return planMap[plan] || `Plan ${plan}`;
  };

  return (
    <div className="bg-muted p-4 rounded-md">
      <h3 className="text-lg font-medium mb-2">Payroll Summary</h3>
      <div className="grid grid-cols-2 gap-2">
        <div>Employee:</div>
        <div className="font-medium">{result.employeeName}</div>
        {result.payrollId && (
          <>
            <div>Payroll ID:</div>
            <div className="font-medium">{result.payrollId}</div>
          </>
        )}
        <div>Pay Period:</div>
        <div className="font-medium">{payPeriod}</div>
        <div>Tax Year:</div>
        <div className="font-medium">{result.taxYear}</div>
        <div>Gross Pay:</div>
        <div className="font-medium">{formatCurrency(result.grossPay)}</div>
        <div>Net Pay:</div>
        <div className="font-medium text-green-600">{formatCurrency(result.netPay)}</div>
        <div>Tax Code:</div>
        <div className="font-medium flex items-center gap-2">
          {result.taxCode}
          {isEmergencyTaxCode && <Badge variant="destructive">Emergency</Badge>}
          {isScottishTaxCode && <Badge>Scottish</Badge>}
        </div>
        {result.taxRegion && result.taxRegion !== 'UK' && (
          <>
            <div>Tax Region:</div>
            <div className="font-medium">{result.taxRegion}</div>
          </>
        )}
        {result.studentLoanPlan && (
          <>
            <div>Student Loan Plan:</div>
            <div className="font-medium">{getStudentLoanPlanName(result.studentLoanPlan)}</div>
          </>
        )}
        {result.pensionPercentage > 0 && (
          <>
            <div>Pension Contribution:</div>
            <div className="font-medium">{result.pensionPercentage}%</div>
          </>
        )}
      </div>
    </div>
  );
}
