
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";
import { Download } from "lucide-react";
import { PayrollHistoryItem } from "./types";

interface PayrollHistoryRowProps {
  item: PayrollHistoryItem;
  onDownload: (item: PayrollHistoryItem) => void;
}

export function PayrollHistoryRow({ item, onDownload }: PayrollHistoryRowProps) {
  return (
    <TableRow key={item.id}>
      <TableCell className="font-medium">{item.employee_name}</TableCell>
      <TableCell>{new Date(item.payroll_period).toLocaleDateString('en-GB', { 
        month: 'long', 
        year: 'numeric'
      })}</TableCell>
      <TableCell>{item.tax_code}</TableCell>
      <TableCell className="text-right">{formatCurrency(item.gross_pay_this_period / 100)}</TableCell>
      <TableCell className="text-right">{formatCurrency(item.income_tax_this_period / 100)}</TableCell>
      <TableCell className="text-right">{formatCurrency(item.nic_employee_this_period / 100)}</TableCell>
      <TableCell className="text-right">{formatCurrency(item.net_pay_this_period / 100)}</TableCell>
      <TableCell className="text-right">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onDownload(item)}
          title="Download Payslip"
        >
          <Download className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
