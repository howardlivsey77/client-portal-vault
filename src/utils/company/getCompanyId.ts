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
