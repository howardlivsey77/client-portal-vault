
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TaxConstant } from "@/services/payroll/utils/tax-constants-service";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface PayrollConstantsTableProps {
  constants: TaxConstant[];
  onEdit: (constant: TaxConstant) => void;
  onDelete: (constant: TaxConstant) => void;
}

export function PayrollConstantsTable({ constants, onEdit, onDelete }: PayrollConstantsTableProps) {
  return (
    <div className="border rounded-md overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Key</TableHead>
            <TableHead>Numeric Value</TableHead>
            <TableHead>Text Value</TableHead>
            <TableHead>Region</TableHead>
            <TableHead>Effective From</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {constants.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                No constants found for this category
              </TableCell>
            </TableRow>
          ) : (
            constants.map((constant) => (
              <TableRow key={constant.id}>
                <TableCell className="font-medium">{constant.key}</TableCell>
                <TableCell>{constant.value_numeric !== null ? constant.value_numeric : '—'}</TableCell>
                <TableCell>{constant.value_text || '—'}</TableCell>
                <TableCell>{constant.region || 'UK'}</TableCell>
                <TableCell>{constant.effective_from ? formatDate(new Date(constant.effective_from)) : '—'}</TableCell>
                <TableCell>{constant.description || '—'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(constant)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(constant)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
