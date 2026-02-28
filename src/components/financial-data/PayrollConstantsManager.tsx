import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { useFinancialData } from "./useFinancialData";
import { FinancialDataForm, FieldDef } from "./FinancialDataForm";
import { useConfirmation } from "@/hooks/useConfirmation";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Badge } from "@/components/ui/badge";

const fields: FieldDef[] = [
  { name: "key", label: "Key", type: "text", required: true },
  { name: "category", label: "Category", type: "text", required: true },
  { name: "description", label: "Description", type: "text" },
  { name: "value_numeric", label: "Numeric Value", type: "number" },
  { name: "value_text", label: "Text Value", type: "text" },
  { name: "region", label: "Region", type: "text", required: true, placeholder: "UK" },
  { name: "effective_from", label: "Effective From", type: "date", required: true },
  { name: "effective_to", label: "Effective To", type: "date" },
  { name: "is_current", label: "Current", type: "boolean" },
];

export function PayrollConstantsManager() {
  const { data, isLoading, insert, update, remove, isSubmitting } = useFinancialData("payroll_constants");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | undefined>();
  const { confirm, confirmationProps } = useConfirmation();

  const handleAdd = () => { setEditing(undefined); setFormOpen(true); };
  const handleEdit = (row: Record<string, unknown>) => { setEditing(row); setFormOpen(true); };
  const handleDelete = (id: string) => {
    confirm({
      title: "Delete constant?",
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
        <Button onClick={handleAdd} size="sm"><Plus className="mr-2 h-4 w-4" />Add Constant</Button>
      </div>
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Effective From</TableHead>
              <TableHead>Current</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row: any) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-sm">{row.key}</TableCell>
                <TableCell><Badge variant="outline">{row.category}</Badge></TableCell>
                <TableCell className="max-w-[200px] truncate">{row.description}</TableCell>
                <TableCell>{row.value_numeric ?? row.value_text ?? "—"}</TableCell>
                <TableCell>{row.region}</TableCell>
                <TableCell>{row.effective_from}</TableCell>
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
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No payroll constants found</TableCell></TableRow>
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
        title={editing ? "Edit Constant" : "Add Constant"}
        isSubmitting={isSubmitting}
      />
      <ConfirmationDialog {...confirmationProps} />
    </div>
  );
}
