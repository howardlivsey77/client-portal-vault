import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Pencil, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks";

interface NicThresholdsGridProps {
  taxYear: string;
}

interface ThresholdRow {
  id: string;
  key: string;
  description: string | null;
  value_numeric: number | null;
  [k: string]: unknown;
}

const THRESHOLD_ORDER = ["LEL", "PT", "ST", "UST", "AUST", "UEL"];

export function NicThresholdsGrid({ taxYear }: NicThresholdsGridProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["financial-data", "payroll_constants", "NI_THRESHOLDS", taxYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_constants")
        .select("*")
        .eq("category", "NI_THRESHOLDS")
        .eq("tax_year", taxYear)
        .order("key");
      if (error) throw error;
      return (data ?? []) as ThresholdRow[];
    },
    enabled: !!taxYear,
  });

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const ai = THRESHOLD_ORDER.indexOf(a.key);
      const bi = THRESHOLD_ORDER.indexOf(b.key);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [rows]);

  useEffect(() => {
    if (editing) {
      const d: Record<string, number> = {};
      sorted.forEach((r) => { d[r.id] = r.value_numeric ?? 0; });
      setDraft(d);
    }
  }, [editing, sorted]);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const row of sorted) {
        const newVal = draft[row.id];
        if (newVal !== row.value_numeric) {
          const { error } = await supabase
            .from("payroll_constants")
            .update({ value_numeric: newVal } as never)
            .eq("id", row.id);
          if (error) throw error;
        }
      }
      queryClient.invalidateQueries({ queryKey: ["financial-data", "payroll_constants"] });
      toast({ title: "Thresholds saved" });
      setEditing(false);
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No NI threshold data for {taxYear}. Add constants with category "NI_THRESHOLDS" in the Payroll Constants tab.</p>;
  }

  const weeklyFactor = 12 / 52;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">National Insurance Thresholds</h3>
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Threshold</TableHead>
              <TableHead className="text-right">Per Month (£)</TableHead>
              <TableHead className="text-right">Per Week (£)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => {
              const monthly = editing ? (draft[row.id] ?? 0) : (row.value_numeric ?? 0);
              const weekly = Math.round(monthly * weeklyFactor * 100) / 100;
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.key}{row.description ? ` — ${row.description}` : ""}</TableCell>
                  <TableCell className="text-right">
                    {editing ? (
                      <Input
                        type="number"
                        step="any"
                        className="w-28 text-right ml-auto"
                        value={draft[row.id] ?? ""}
                        onChange={(e) => setDraft((d) => ({ ...d, [row.id]: parseFloat(e.target.value) || 0 }))}
                      />
                    ) : (
                      `£${monthly.toLocaleString()}`
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">£{weekly.toLocaleString()}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
