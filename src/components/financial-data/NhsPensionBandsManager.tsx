import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { useFinancialData } from "./useFinancialData";
import { FinancialDataForm, FieldDef } from "./FinancialDataForm";
import { useConfirmation } from "@/hooks/useConfirmation";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

const fields: FieldDef[] = [
  { name: "tax_year", label: "Tax Year", type: "text", required: true, placeholder: "2025-26" },
  { name: "tier_number", label: "Tier Number", type: "number", required: true },
  { name: "annual_pensionable_pay_from", label: "Pay From (£)", type: "number", required: true },
  { name: "annual_pensionable_pay_to", label: "Pay To (£)", type: "number" },
  { name: "employee_contribution_rate", label: "Employee Rate (%)", type: "number", required: true },
  { name: "employer_contribution_rate", label: "Employer Rate (%)", type: "number", required: true },
  { name: "effective_from", label: "Effective From", type: "date", required: true },
  { name: "effective_to", label: "Effective To", type: "date" },
  { name: "is_current", label: "Current", type: "boolean" },
];

interface NhsPensionBandsManagerProps {
  taxYear: string;
}

export function NhsPensionBandsManager({ taxYear }: NhsPensionBandsManagerProps) {
  const { data, isLoading, insert, update, remove, isSubmitting } = useFinancialData("nhs_pension_bands", { taxYear });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | undefined>();
  const { confirm, confirmationProps } = useConfirmation();

  const handleAdd = () => { setEditing({ tax_year: taxYear }); setFormOpen(true); };
  const handleEdit = (row: Record<string, unknown>) => { setEditing(row); setFormOpen(true); };
  const handleDelete = (id: string) => {
    confirm({
      title: "Delete NHS pension band?",
      description: "This action cannot be undone.",
      onConfirm: () => remove(id),
      variant: "destructive",
    });
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (editing?.id) {
      await update({ id: editing.id, ...values });
    } else {
      await insert(values);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAdd} size="sm"><Plus className="mr-2 h-4 w-4" />Add Pension Band</Button>
      </div>
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tier</TableHead>
              <TableHead>Pay From (£)</TableHead>
              <TableHead>Pay To (£)</TableHead>
              <TableHead>Employee (%)</TableHead>
              <TableHead>Employer (%)</TableHead>
              <TableHead>Current</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row: any) => (
              <TableRow key={row.id}>
                <TableCell>{row.tier_number}</TableCell>
                <TableCell>{row.annual_pensionable_pay_from?.toLocaleString()}</TableCell>
                <TableCell>{row.annual_pensionable_pay_to?.toLocaleString() ?? "—"}</TableCell>
                <TableCell>{row.employee_contribution_rate}</TableCell>
                <TableCell>{row.employer_contribution_rate}</TableCell>
                <TableCell>{row.is_current ? "✓" : "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No NHS pension bands found for {taxYear}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <FinancialDataForm
        open={formOpen}
        onOpenChange={setFormOpen}
        fields={fields}
        defaultValues={editing}
        onSubmit={handleSubmit}
        title={editing?.id ? "Edit Pension Band" : "Add Pension Band"}
        isSubmitting={isSubmitting}
      />
      <ConfirmationDialog {...confirmationProps} />
    </div>
  );
}
