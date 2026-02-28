import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Pencil, Save, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks";

interface StudentLoansManagerProps {
  taxYear: string;
}

interface ConstantRow {
  id: string;
  key: string;
  value_numeric: number | null;
  description: string | null;
  [k: string]: unknown;
}

const PLAN_ORDER = ["PLAN_1", "PLAN_2", "PLAN_4", "PGL"];
const PLAN_LABELS: Record<string, string> = {
  PLAN_1: "Plan 1",
  PLAN_2: "Plan 2",
  PLAN_4: "Plan 4",
  PGL: "Postgraduate Loan",
};

function planKey(key: string): string {
  if (key.startsWith("PGL")) return "PGL";
  return key.replace(/_THRESHOLD|_RATE/, "");
}

export function StudentLoansManager({ taxYear }: StudentLoansManagerProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["financial-data", "payroll_constants", taxYear, "STUDENT_LOAN"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_constants")
        .select("*")
        .eq("tax_year", taxYear)
        .eq("category", "STUDENT_LOAN")
        .order("key");
      if (error) throw error;
      return (data ?? []) as ConstantRow[];
    },
    enabled: !!taxYear,
  });

  const plans = useMemo(() => {
    const map = new Map<string, { threshold?: ConstantRow; rate?: ConstantRow }>();
    rows.forEach((r) => {
      const pk = planKey(r.key);
      if (!map.has(pk)) map.set(pk, {});
      const entry = map.get(pk)!;
      if (r.key.endsWith("_THRESHOLD")) entry.threshold = r;
      else if (r.key.endsWith("_RATE")) entry.rate = r;
    });
    return PLAN_ORDER.filter((p) => map.has(p)).map((p) => ({ plan: p, ...map.get(p)! }));
  }, [rows]);

  useEffect(() => {
    if (editing) {
      const d: Record<string, number> = {};
      rows.forEach((r) => { d[r.id] = r.value_numeric ?? 0; });
      setDraft(d);
    }
  }, [editing, rows]);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const row of rows) {
        const newVal = draft[row.id];
        if (newVal !== undefined && newVal !== row.value_numeric) {
          const { error } = await supabase
            .from("payroll_constants")
            .update({ value_numeric: newVal } as never)
            .eq("id", row.id);
          if (error) throw error;
        }
      }
      queryClient.invalidateQueries({ queryKey: ["financial-data", "payroll_constants"] });
      toast({ title: "Student loan constants saved" });
      setEditing(false);
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  if (plans.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No student loan data for {taxYear}.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Student Loan Repayment Thresholds &amp; Rates</h3>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="mr-1 h-3.5 w-3.5" />Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={saving}>
              <X className="mr-1 h-3.5 w-3.5" />Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1 h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        )}
      </div>
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead className="text-right">Monthly Threshold (£)</TableHead>
              <TableHead className="text-right">Rate (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map(({ plan, threshold, rate }) => (
              <TableRow key={plan}>
                <TableCell className="font-medium">{PLAN_LABELS[plan] ?? plan}</TableCell>
                <TableCell className="text-right">
                  {editing && threshold ? (
                    <Input
                      type="number"
                      step="0.01"
                      className="w-28 text-right ml-auto"
                      value={draft[threshold.id] ?? ""}
                      onChange={(e) => setDraft((d) => ({ ...d, [threshold.id]: parseFloat(e.target.value) || 0 }))}
                    />
                  ) : (
                    threshold?.value_numeric != null ? `£${threshold.value_numeric.toLocaleString("en-GB", { minimumFractionDigits: 2 })}` : "—"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editing && rate ? (
                    <Input
                      type="number"
                      step="0.01"
                      className="w-20 text-right ml-auto"
                      value={draft[rate.id] != null ? (draft[rate.id] * 100) : ""}
                      onChange={(e) => setDraft((d) => ({ ...d, [rate.id]: (parseFloat(e.target.value) || 0) / 100 }))}
                    />
                  ) : (
                    rate?.value_numeric != null ? `${(rate.value_numeric * 100).toFixed(0)}%` : "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
