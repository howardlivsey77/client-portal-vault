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

export function useFinancialData(table: TableName) {
  const queryClient = useQueryClient();
  const queryKey = ["financial-data", table];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const orderFields = orderConfig[table].split(",");
      let q = supabase.from(table).select("*");
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
      queryClient.invalidateQueries({ queryKey });
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
      queryClient.invalidateQueries({ queryKey });
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
      queryClient.invalidateQueries({ queryKey });
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
