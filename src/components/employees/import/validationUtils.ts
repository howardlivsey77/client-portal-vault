
// Validation utilities for employee import fields

/**
 * Validate UK National Insurance Number format
 * Expected format: QQ123456C (2 letters, 6 digits, 1 letter)
 */
export const validateNationalInsuranceNumber = (niNumber: string): boolean => {
  if (!niNumber || typeof niNumber !== 'string') {
    return false;
  }

  // Remove spaces and convert to uppercase
  const cleaned = niNumber.replace(/\s/g, '').toUpperCase();
  
  // Check format: 2 letters + 6 digits + 1 letter
  const niPattern = /^[A-CEGHJ-PR-TW-Z]{2}[0-9]{6}[A-D]$/;
  
  if (!niPattern.test(cleaned)) {
    return false;
  }

  // Additional validation: first two letters cannot be certain combinations
  const invalidPrefixes = ['BG', 'GB', 'NK', 'KN', 'TN', 'NT', 'ZZ'];
  const prefix = cleaned.substring(0, 2);
  
  return !invalidPrefixes.includes(prefix);
};

/**
 * Normalize National Insurance Number to standard format (no spaces)
 * Returns format: QQ123456C
 */
export const normalizeNationalInsuranceNumber = (niNumber: string): string | null => {
  if (!niNumber || typeof niNumber !== 'string') {
    return null;
  }

  const cleaned = niNumber.replace(/\s/g, '').toUpperCase();
  
  if (!validateNationalInsuranceNumber(cleaned)) {
    return null;
  }

  // Return without spaces for consistent storage
  return cleaned;
};

/**
 * Validate NIC Code
 * Valid codes: A, B, C, H, J, M, Z
 */
export const validateNicCode = (nicCode: string): boolean => {
  if (!nicCode || typeof nicCode !== 'string') {
    return false;
  }

  const validCodes = ['A', 'B', 'C', 'H', 'J', 'M', 'Z'];
  return validCodes.includes(nicCode.toUpperCase().trim());
};

/**
 * Normalize NIC Code to uppercase
 */
export const normalizeNicCode = (nicCode: string): string | null => {
  if (!nicCode || typeof nicCode !== 'string') {
    return null;
  }

  const cleaned = nicCode.toUpperCase().trim();
  
  if (!validateNicCode(cleaned)) {
    return null;
  }

  return cleaned;
};
