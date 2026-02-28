import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TaxYearSelectorProps {
  selected: string;
  onChange: (year: string) => void;
  onAddYear: () => void;
}

async function fetchDistinctTaxYears(): Promise<string[]> {
  const results = await Promise.all([
    supabase.from("payroll_constants").select("tax_year").not("tax_year", "is", null),
    supabase.from("nic_bands").select("tax_year"),
    supabase.from("nhs_pension_bands").select("tax_year"),
    supabase.from("tax_bands").select("tax_year"),
  ]);

  const years = new Set<string>();
  for (const { data } of results) {
    if (data) {
      for (const row of data) {
        if ((row as any).tax_year) years.add((row as any).tax_year);
      }
    }
  }

  return Array.from(years).sort().reverse();
}

export function TaxYearSelector({ selected, onChange, onAddYear }: TaxYearSelectorProps) {
  const { data: years = [] } = useQuery({
    queryKey: ["tax-years-distinct"],
    queryFn: fetchDistinctTaxYears,
  });

  // Auto-select first year when data loads and nothing selected
  useEffect(() => {
    if (!selected && years.length > 0) {
      onChange(years[0]);
    }
  }, [years, selected, onChange]);

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Tax Year</label>
      <Select value={selected} onValueChange={onChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Select year" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={y}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={onAddYear}>
        <Plus className="mr-1 h-4 w-4" />Add Year
      </Button>
    </div>
  );
}
