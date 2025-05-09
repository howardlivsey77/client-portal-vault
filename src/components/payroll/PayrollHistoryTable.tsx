
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PayrollHistoryEmpty } from "./history/PayrollHistoryEmpty";
import { PayrollHistoryLoading } from "./history/PayrollHistoryLoading";
import { PayrollHistoryTableContent } from "./history/PayrollHistoryTable";
import { usePayrollHistory } from "./history/usePayrollHistory";
import { usePayslipGenerator } from "./history/usePayslipGenerator";

export function PayrollHistoryTable() {
  const { loading, payrollHistory } = usePayrollHistory();
  const { handleDownloadPayslip } = usePayslipGenerator();

  if (loading) {
    return <PayrollHistoryLoading />;
  }

  if (payrollHistory.length === 0) {
    return <PayrollHistoryEmpty />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll History</CardTitle>
      </CardHeader>
      <CardContent>
        <PayrollHistoryTableContent 
          payrollHistory={payrollHistory}
          onDownloadPayslip={handleDownloadPayslip}
        />
      </CardContent>
    </Card>
  );
}
