
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TaxConstant } from "@/services/payroll/utils/tax-constants-service";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Check, X } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";

interface PayrollConstantsTableProps {
  constants: TaxConstant[];
  onEdit: (constant: TaxConstant) => void;
  onDelete: (constant: TaxConstant) => void;
}

export function PayrollConstantsTable({ constants, onEdit, onDelete }: PayrollConstantsTableProps) {
  // Function to check if a tax constant is currently active
  const isActive = (constant: TaxConstant) => {
    const now = new Date();
    const effectiveFrom = constant.effective_from ? new Date(constant.effective_from) : null;
    const effectiveTo = constant.effective_to ? new Date(constant.effective_to) : null;
    
    // Check if the current date is within the effective range
    return constant.is_current && 
      (!effectiveFrom || effectiveFrom <= now) && 
      (!effectiveTo || effectiveTo >= now);
  };

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
            <TableHead>Effective To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {constants.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                No constants found for this category
              </TableCell>
            </TableRow>
          ) : (
            constants.map((constant) => {
              const active = isActive(constant);
              
              return (
                <TableRow key={constant.id} className={active ? "" : "opacity-60"}>
                  <TableCell className="font-medium">{constant.key}</TableCell>
                  <TableCell>{constant.value_numeric !== null ? constant.value_numeric : '—'}</TableCell>
                  <TableCell>{constant.value_text || '—'}</TableCell>
                  <TableCell>{constant.region || 'UK'}</TableCell>
                  <TableCell>{constant.effective_from ? formatDate(new Date(constant.effective_from)) : '—'}</TableCell>
                  <TableCell>{constant.effective_to ? formatDate(new Date(constant.effective_to)) : '—'}</TableCell>
                  <TableCell>
                    {active ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center gap-1">
                        <X className="h-3 w-3" /> Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={constant.description || ''}>
                    {constant.description || '—'}
                  </TableCell>
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
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
