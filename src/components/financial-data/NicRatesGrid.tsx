import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Pencil, Save, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks";

interface NicRatesGridProps {
  taxYear: string;
  contributionType: "Employee" | "Employer";
}

interface NicBandRow {
  id: string;
  ni_class: string;
  name: string;
  contribution_type: string;
  threshold_from: number;
  threshold_to: number | null;
  rate: number;
  [k: string]: unknown;
}

// Derive column labels from threshold ranges
function bandLabel(from: number, to: number | null): string {
  if (to === null || to === undefined) return `Above £${from.toLocaleString()}`;
  return `£${from.toLocaleString()} – £${to.toLocaleString()}`;
}

export function NicRatesGrid({ taxYear, contributionType }: NicRatesGridProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["financial-data", "nic_bands", taxYear, contributionType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nic_bands")
        .select("*")
        .eq("tax_year", taxYear)
        .eq("contribution_type", contributionType)
        .order("ni_class")
        .order("threshold_from");
      if (error) throw error;
      return (data ?? []) as NicBandRow[];
    },
    enabled: !!taxYear,
  });

  // Build grid: rows = NI categories, columns = earnings bands
  const { categories, bands, gridMap } = useMemo(() => {
    const catSet = new Set<string>();
    const bandMap = new Map<string, { from: number; to: number | null }>();

    rows.forEach((r) => {
      catSet.add(r.ni_class);
      const key = `${r.threshold_from}-${r.threshold_to ?? "inf"}`;
      if (!bandMap.has(key)) bandMap.set(key, { from: r.threshold_from, to: r.threshold_to });
    });

    const bands = Array.from(bandMap.entries()).sort((a, b) => a[1].from - b[1].from);
    const categories = Array.from(catSet).sort();

    const gridMap: Record<string, NicBandRow> = {};
    rows.forEach((r) => {
      const bandKey = `${r.threshold_from}-${r.threshold_to ?? "inf"}`;
      gridMap[`${r.ni_class}|${bandKey}`] = r;
    });

    return { categories, bands, gridMap };
  }, [rows]);

  useEffect(() => {
    if (editing) {
      const d: Record<string, number> = {};
      rows.forEach((r) => { d[r.id] = r.rate; });
      setDraft(d);
    }
  }, [editing, rows]);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const row of rows) {
        const newVal = draft[row.id];
        if (newVal !== undefined && newVal !== row.rate) {
          const { error } = await supabase
            .from("nic_bands")
            .update({ rate: newVal } as never)
            .eq("id", row.id);
          if (error) throw error;
        }
      }
      queryClient.invalidateQueries({ queryKey: ["financial-data", "nic_bands"] });
      toast({ title: `${contributionType} rates saved` });
      setEditing(false);
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No {contributionType.toLowerCase()} NIC rate data for {taxYear}.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{contributionType} Contribution Rates</h3>
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
              <TableHead>NI Category</TableHead>
              {bands.map(([key, b]) => (
                <TableHead key={key} className="text-right text-xs">{bandLabel(b.from, b.to)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat}>
                <TableCell className="font-medium">{cat}</TableCell>
                {bands.map(([bandKey]) => {
                  const row = gridMap[`${cat}|${bandKey}`];
                  if (!row) return <TableCell key={bandKey} className="text-right text-muted-foreground">—</TableCell>;

                  return (
                    <TableCell key={bandKey} className="text-right">
                      {editing ? (
                        <Input
                          type="number"
                          step="any"
                          className="w-20 text-right ml-auto"
                          value={draft[row.id] ?? ""}
                          onChange={(e) => setDraft((d) => ({ ...d, [row.id]: parseFloat(e.target.value) || 0 }))}
                        />
                      ) : (
                        `${row.rate}%`
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
