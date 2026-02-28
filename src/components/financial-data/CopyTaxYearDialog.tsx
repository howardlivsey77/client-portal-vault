import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks";

interface CopyTaxYearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingYears: string[];
  onCreated: (newYear: string) => void;
}

const TABLES_TO_COPY = ["payroll_constants", "nic_bands", "nhs_pension_bands", "tax_bands"] as const;

function deriveEffectiveDates(newYear: string) {
  const startYear = parseInt(newYear.split("/")[0]);
  return {
    effective_from: `${startYear}-04-06`,
    effective_to: `${startYear + 1}-04-05`,
  };
}

export function CopyTaxYearDialog({ open, onOpenChange, existingYears, onCreated }: CopyTaxYearDialogProps) {
  const [newYear, setNewYear] = useState("");
  const [sourceYear, setSourceYear] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleCreate = async () => {
    if (!newYear.match(/^\d{4}\/\d{2}$/)) {
      toast({ title: "Invalid format", description: "Use format like 2026/27", variant: "destructive" });
      return;
    }
    if (existingYears.includes(newYear)) {
      toast({ title: "Year already exists", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      if (sourceYear) {
        const dates = deriveEffectiveDates(newYear);

        for (const table of TABLES_TO_COPY) {
          const { data: rows, error: fetchErr } = await supabase
            .from(table)
            .select("*")
            .eq("tax_year", sourceYear);

          if (fetchErr) throw fetchErr;
          if (!rows?.length) continue;

          const newRows = rows.map((row: any) => {
            const { id, created_at, updated_at, ...rest } = row;
            return {
              ...rest,
              tax_year: newYear,
              effective_from: dates.effective_from,
              effective_to: dates.effective_to,
              is_current: false,
            };
          });

          const { error: insertErr } = await supabase.from(table).insert(newRows as never);
          if (insertErr) throw insertErr;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["tax-years-distinct"] });
      queryClient.invalidateQueries({ queryKey: ["financial-data"] });
      toast({ title: `Tax year ${newYear} created` });
      onCreated(newYear);
      onOpenChange(false);
      setNewYear("");
      setSourceYear("");
    } catch (err: any) {
      toast({ title: "Failed to create tax year", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Tax Year</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>New Tax Year</Label>
            <Input placeholder="2026/27" value={newYear} onChange={(e) => setNewYear(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Copy data from (optional)</Label>
            <Select value={sourceYear} onValueChange={setSourceYear}>
              <SelectTrigger>
                <SelectValue placeholder="Start blank" />
              </SelectTrigger>
              <SelectContent>
                {existingYears.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={isSubmitting || !newYear}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
