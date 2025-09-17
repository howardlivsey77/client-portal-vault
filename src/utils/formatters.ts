/**
 * Formats the current entitlement tier as a readable string
 * @param fullPayDays - Number of full pay entitled days
 * @param halfPayDays - Number of half pay entitled days
 * @returns Formatted string like "10 days Full, 5 days Half"
 */
export const formatEntitlementTier = (fullPayDays: number, halfPayDays: number): string => {
  const fullText = fullPayDays === 1 ? "1 day Full" : `${fullPayDays} days Full`;
  const halfText = halfPayDays === 1 ? "1 day Half" : `${halfPayDays} days Half`;
  
  if (fullPayDays === 0 && halfPayDays === 0) {
    return "No paid entitlement";
  }
  
  return `${fullText}, ${halfText}`;
};