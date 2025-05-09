
import { supabase } from "@/integrations/supabase/client";
import { TaxConstant } from "@/services/payroll/utils/tax-constants-service";
import { useToast } from "@/hooks/use-toast";

export async function fetchConstants(category: string, showHistorical: boolean) {
  try {
    let query = supabase
      .from("payroll_constants")
      .select("*")
      .eq("category", category)
      .order("key");
    
    // Only filter by is_current if we're not showing historical data
    if (!showHistorical) {
      query = query.eq("is_current", true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error loading constants:", error);
    throw error;
  }
}

export async function saveConstant(constant: Partial<TaxConstant>, editingConstant: TaxConstant | null) {
  if (editingConstant) {
    // Update existing constant
    const { error } = await supabase
      .from("payroll_constants")
      .update({
        key: constant.key,
        value_numeric: constant.value_numeric,
        value_text: constant.value_text,
        description: constant.description,
        region: constant.region,
        effective_from: constant.effective_from,
        effective_to: constant.effective_to,
      })
      .eq("id", editingConstant.id);
    
    if (error) throw error;
    return "updated";
  } else {
    // Insert new constant
    const { error } = await supabase
      .from("payroll_constants")
      .insert({
        category: constant.category,
        key: constant.key,
        value_numeric: constant.value_numeric,
        value_text: constant.value_text,
        description: constant.description,
        region: constant.region || 'UK',
        effective_from: constant.effective_from || new Date().toISOString(),
        is_current: true,
      });
    
    if (error) throw error;
    return "added";
  }
}

export async function deleteConstant(constantId: string) {
  const { error } = await supabase
    .from("payroll_constants")
    .delete()
    .eq("id", constantId);
  
  if (error) throw error;
}
