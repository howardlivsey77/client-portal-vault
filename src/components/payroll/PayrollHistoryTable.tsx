
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PayrollHistoryEmpty } from "./history/PayrollHistoryEmpty";
import { PayrollHistoryLoading } from "./history/PayrollHistoryLoading";
import { PayrollHistoryTableContent } from "./history/PayrollHistoryTable";
import { usePayrollHistory } from "./history/usePayrollHistory";
import { usePayslipGenerator } from "./history/usePayslipGenerator";
import { PayrollHistoryFilter } from "./history/PayrollHistoryFilter";
import { PayrollHistoryPagination } from "./history/PayrollHistoryPagination";

export function PayrollHistoryTable() {
  const { 
    loading, 
    payrollHistory, 
    handleFilterChange, 
    totalCount,
    currentPage,
    pageSize,
    handlePageChange 
  } = usePayrollHistory();
  
  const { handleDownloadPayslip } = usePayslipGenerator();

  if (loading) {
    return <PayrollHistoryLoading />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll History</CardTitle>
      </CardHeader>
      <CardContent>
        <PayrollHistoryFilter onFilterChange={handleFilterChange} />
        
        {payrollHistory.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-muted-foreground">No payroll history found.</p>
            <p className="text-muted-foreground">Use the calculator tab to process and save payroll results.</p>
          </div>
        ) : (
          <>
            <PayrollHistoryTableContent 
              payrollHistory={payrollHistory}
              onDownloadPayslip={handleDownloadPayslip}
            />
            
            <PayrollHistoryPagination
              currentPage={currentPage}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={handlePageChange}
            />
            
            <div className="text-xs text-muted-foreground mt-2 text-center">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} records
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
