import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks";

type TableName = "payroll_constants" | "nic_bands" | "nhs_pension_bands" | "tax_bands";

const orderConfig: Record<TableName, string> = {
  payroll_constants: "category,key",
  nic_bands: "tax_year,contribution_type,threshold_from",
  nhs_pension_bands: "tax_year,tier_number",
  tax_bands: "tax_year,threshold_from",
};

interface UseFinancialDataOptions {
  taxYear?: string;
  excludeCategories?: string[];
}

export function useFinancialData(table: TableName, options?: UseFinancialDataOptions) {
  const queryClient = useQueryClient();
  const taxYear = options?.taxYear;
  const excludeCategories = options?.excludeCategories;
  const queryKey = ["financial-data", table, taxYear ?? "all", excludeCategories?.join(",") ?? ""];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const orderFields = orderConfig[table].split(",");
      let q = supabase.from(table).select("*");

      if (taxYear) {
        q = q.eq("tax_year", taxYear);
      }

      if (excludeCategories?.length && table === "payroll_constants") {
        q = q.not("category", "in", `(${excludeCategories.join(",")})`);
      }

      for (const field of orderFields) {
        q = q.order(field, { ascending: true });
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const insertMutation = useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      const { id, created_at, updated_at, ...rest } = row;
      const { error } = await supabase.from(table).insert(rest as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-data", table] });
      queryClient.invalidateQueries({ queryKey: ["tax-years-distinct"] });
      toast({ title: "Record created successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create record", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...rest }: Record<string, unknown>) => {
      const { created_at, updated_at, ...fields } = rest;
      const { error } = await supabase.from(table).update(fields as never).eq("id", id as string);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-data", table] });
      toast({ title: "Record updated successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update record", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-data", table] });
      queryClient.invalidateQueries({ queryKey: ["tax-years-distinct"] });
      toast({ title: "Record deleted successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to delete record", description: err.message, variant: "destructive" });
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    insert: insertMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    isSubmitting: insertMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}
