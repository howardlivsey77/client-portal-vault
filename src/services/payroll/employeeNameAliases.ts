
import { supabase } from "@/integrations/supabase/client";

export interface EmployeeNameAlias {
  id: string;
  company_id: string;
  source_name: string;
  employee_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all saved employee name aliases for a company
 * Returns a map of source_name -> employee_id for quick lookup
 */
export async function getSavedAliases(companyId: string): Promise<Record<string, string>> {
  if (!companyId) {
    console.warn('getSavedAliases called without companyId');
    return {};
  }

  const { data, error } = await supabase
    .from('employee_name_aliases')
    .select('source_name, employee_id')
    .eq('company_id', companyId);

  if (error) {
    console.error('Error fetching employee name aliases:', error);
    return {};
  }

  const aliasMap: Record<string, string> = {};
  for (const alias of data || []) {
    aliasMap[alias.source_name.toLowerCase().trim()] = alias.employee_id;
  }

  console.log(`Loaded ${Object.keys(aliasMap).length} saved employee name aliases for company ${companyId}`);
  return aliasMap;
}

/**
 * Save a single employee name alias
 */
export async function saveAlias(
  companyId: string, 
  sourceName: string, 
  employeeId: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('employee_name_aliases')
    .upsert({
      company_id: companyId,
      source_name: sourceName.trim(),
      employee_id: employeeId,
      created_by: user?.id || null
    }, {
      onConflict: 'company_id,source_name'
    });

  if (error) {
    console.error('Error saving employee name alias:', error);
    return false;
  }

  console.log(`Saved alias: "${sourceName}" -> ${employeeId}`);
  return true;
}

/**
 * Delete an employee name alias
 */
export async function deleteAlias(companyId: string, sourceName: string): Promise<boolean> {
  const { error } = await supabase
    .from('employee_name_aliases')
    .delete()
    .eq('company_id', companyId)
    .eq('source_name', sourceName.trim());

  if (error) {
    console.error('Error deleting employee name alias:', error);
    return false;
  }

  console.log(`Deleted alias: "${sourceName}"`);
  return true;
}

/**
 * Bulk save employee name aliases
 */
export async function saveAliases(
  companyId: string, 
  mappings: Array<{ sourceName: string; employeeId: string }>
): Promise<{ saved: number; failed: number }> {
  if (!companyId || mappings.length === 0) {
    return { saved: 0, failed: 0 };
  }

  const { data: { user } } = await supabase.auth.getUser();

  const aliasRecords = mappings.map(m => ({
    company_id: companyId,
    source_name: m.sourceName.trim(),
    employee_id: m.employeeId,
    created_by: user?.id || null
  }));

  const { error } = await supabase
    .from('employee_name_aliases')
    .upsert(aliasRecords, {
      onConflict: 'company_id,source_name'
    });

  if (error) {
    console.error('Error bulk saving employee name aliases:', error);
    return { saved: 0, failed: mappings.length };
  }

  console.log(`Bulk saved ${mappings.length} employee name aliases`);
  return { saved: mappings.length, failed: 0 };
}

/**
 * Get all aliases for a company with full employee details
 */
export async function getAliasesWithDetails(companyId: string): Promise<Array<{
  id: string;
  source_name: string;
  employee_id: string;
  employee_name: string;
  created_at: string;
}>> {
  if (!companyId) {
    return [];
  }

  const { data, error } = await supabase
    .from('employee_name_aliases')
    .select(`
      id,
      source_name,
      employee_id,
      created_at,
      employees!inner(first_name, last_name)
    `)
    .eq('company_id', companyId)
    .order('source_name');

  if (error) {
    console.error('Error fetching aliases with details:', error);
    return [];
  }

  return (data || []).map(alias => ({
    id: alias.id,
    source_name: alias.source_name,
    employee_id: alias.employee_id,
    employee_name: `${(alias.employees as any)?.first_name || ''} ${(alias.employees as any)?.last_name || ''}`.trim(),
    created_at: alias.created_at
  }));
}
