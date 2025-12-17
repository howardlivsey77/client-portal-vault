import { supabase } from "@/integrations/supabase/client";

/**
 * Utility function to resolve company ID from various sources
 * Priority: explicit param > localStorage fallback
 * 
 * @param companyId - Optional explicitly provided company ID
 * @returns The resolved company ID or null if none found
 */
export function getCompanyId(companyId?: string | null): string | null {
  // Use explicit param if provided
  if (companyId) {
    return companyId;
  }
  
  // Fall back to localStorage
  const storedCompanyId = localStorage.getItem('lastSelectedCompany');
  return storedCompanyId || null;
}

/**
 * Get company ID or throw if not found
 * Use this when company ID is required
 */
export function requireCompanyId(companyId?: string | null): string {
  const resolved = getCompanyId(companyId);
  if (!resolved) {
    throw new Error("No company ID available. Please select a company first.");
  }
  return resolved;
}

/**
 * Async version of getCompanyId with RPC fallback
 * Use this in services where you need to fetch company ID from the database
 * Priority: explicit param > localStorage > RPC fallback (user's first company)
 * 
 * @param companyId - Optional explicitly provided company ID
 * @returns The resolved company ID or null if none found
 */
export async function getCompanyIdAsync(companyId?: string | null): Promise<string | null> {
  // Use explicit param if provided
  if (companyId) {
    console.log('Using explicitly provided company ID:', companyId);
    return companyId;
  }
  
  // Try localStorage first
  const storedCompanyId = localStorage.getItem('lastSelectedCompany');
  if (storedCompanyId) {
    console.log('Using company ID from localStorage:', storedCompanyId);
    return storedCompanyId;
  }
  
  // RPC fallback - fetch user's first company
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return null;
    }
    
    const { data: companies, error } = await supabase.rpc('get_user_companies', {
      _user_id: user.id,
    });
    
    if (error) {
      console.error('Error fetching user companies:', error);
      return null;
    }
    
    if (companies && companies.length > 0) {
      const fetchedCompanyId = companies[0].id;
      console.log('Using first available company ID:', fetchedCompanyId);
      return fetchedCompanyId;
    }
    
    console.warn('No companies found for user');
    return null;
  } catch (error) {
    console.error('Error getting current company ID:', error);
    return null;
  }
}

/**
 * Async version that throws if no company ID found
 */
export async function requireCompanyIdAsync(companyId?: string | null): Promise<string> {
  const resolved = await getCompanyIdAsync(companyId);
  if (!resolved) {
    throw new Error("Unable to determine company ID. Please ensure you have selected a company and try again.");
  }
  return resolved;
}
