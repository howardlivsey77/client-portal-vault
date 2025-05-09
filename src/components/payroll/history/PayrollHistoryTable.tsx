
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PayrollHistoryItem } from "./types";
import { PayrollHistoryRow } from "./PayrollHistoryRow";

interface PayrollHistoryTableProps {
  payrollHistory: PayrollHistoryItem[];
  onDownloadPayslip: (item: PayrollHistoryItem) => void;
}

export function PayrollHistoryTableContent({ payrollHistory, onDownloadPayslip }: PayrollHistoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Tax Code</TableHead>
            <TableHead className="text-right">Gross Pay</TableHead>
            <TableHead className="text-right">Income Tax</TableHead>
            <TableHead className="text-right">NI</TableHead>
            <TableHead className="text-right">Net Pay</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payrollHistory.map((item) => (
            <PayrollHistoryRow 
              key={item.id}
              item={item} 
              onDownload={onDownloadPayslip} 
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
