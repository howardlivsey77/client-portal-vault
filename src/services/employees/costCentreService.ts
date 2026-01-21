import { supabase } from "@/integrations/supabase/client";

export interface CostCentre {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateCostCentreData {
  name: string;
  description?: string;
  company_id: string;
}

export interface UpdateCostCentreData {
  name?: string;
  description?: string;
  is_active?: boolean;
}

/**
 * Fetch all cost centres for a company
 */
export const fetchCostCentresByCompany = async (companyId: string): Promise<CostCentre[]> => {
  const { data, error } = await supabase
    .from('cost_centres')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching cost centres:", error);
    throw new Error(`Failed to fetch cost centres: ${error.message}`);
  }

  return data || [];
};

/**
 * Create a new cost centre
 */
export const createCostCentre = async (costCentreData: CreateCostCentreData): Promise<CostCentre> => {
  const { data, error } = await supabase
    .from('cost_centres')
    .insert([costCentreData])
    .select()
    .single();

  if (error) {
    console.error("Error creating cost centre:", error);
    throw new Error(`Failed to create cost centre: ${error.message}`);
  }

  return data;
};

/**
 * Update a cost centre
 */
export const updateCostCentre = async (costCentreId: string, updateData: UpdateCostCentreData): Promise<CostCentre> => {
  const { data, error } = await supabase
    .from('cost_centres')
    .update(updateData)
    .eq('id', costCentreId)
    .select()
    .single();

  if (error) {
    console.error("Error updating cost centre:", error);
    throw new Error(`Failed to update cost centre: ${error.message}`);
  }

  return data;
};

/**
 * Delete a cost centre (soft delete by setting is_active to false)
 */
export const deleteCostCentre = async (costCentreId: string): Promise<void> => {
  const { error } = await supabase
    .from('cost_centres')
    .update({ is_active: false })
    .eq('id', costCentreId);

  if (error) {
    console.error("Error deleting cost centre:", error);
    throw new Error(`Failed to delete cost centre: ${error.message}`);
  }
};

/**
 * Get cost centre names as string array for a company
 */
export const getCostCentreNames = async (companyId: string): Promise<string[]> => {
  const costCentres = await fetchCostCentresByCompany(companyId);
  return costCentres.map(cc => cc.name);
};
