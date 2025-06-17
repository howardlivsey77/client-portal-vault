
import { supabase } from "@/integrations/supabase/client";

/**
 * Check for duplicate payroll IDs in the database
 */
export const checkDuplicatePayrollIds = async (payrollIds: string[]): Promise<string[]> => {
  console.log('Checking for duplicate payroll IDs in database:', payrollIds);
  
  if (!payrollIds || payrollIds.length === 0) {
    console.log('No payroll IDs to check');
    return [];
  }
  
  // Filter out any null, undefined, or empty payroll IDs
  const validPayrollIds = payrollIds.filter(id => id && id.trim() !== '');
  console.log('Valid payroll IDs for database check:', validPayrollIds);
  
  if (validPayrollIds.length === 0) {
    console.log('No valid payroll IDs after filtering');
    return [];
  }
  
  const { data, error } = await supabase
    .from("employees")
    .select("payroll_id")
    .in("payroll_id", validPayrollIds);
  
  if (error) {
    console.error('Error checking for duplicate payroll IDs:', error);
    throw error;
  }
  
  const duplicates = data ? data.map(emp => emp.payroll_id) : [];
  console.log('Found duplicate payroll IDs in database:', duplicates);
  
  return duplicates;
};

/**
 * Check for duplicate emails in the database
 */
export const checkDuplicateEmails = async (emails: string[]): Promise<string[]> => {
  console.log('Checking for duplicate emails in database:', emails);
  
  if (!emails || emails.length === 0) {
    console.log('No emails to check');
    return [];
  }
  
  // Filter out any null, undefined, or empty emails
  const validEmails = emails.filter(email => email && email.trim() !== '');
  console.log('Valid emails for database check:', validEmails);
  
  if (validEmails.length === 0) {
    console.log('No valid emails after filtering');
    return [];
  }
  
  const { data, error } = await supabase
    .from("employees")
    .select("email")
    .in("email", validEmails);
  
  if (error) {
    console.error('Error checking for duplicate emails:', error);
    throw error;
  }
  
  const duplicates = data ? data.map(emp => emp.email) : [];
  console.log('Found duplicate emails in database:', duplicates);
  
  return duplicates;
};

/**
 * Check for duplicate National Insurance Numbers in the database
 */
export const checkDuplicateNationalInsuranceNumbers = async (niNumbers: string[]): Promise<string[]> => {
  console.log('Checking for duplicate National Insurance Numbers in database:', niNumbers);
  
  if (!niNumbers || niNumbers.length === 0) {
    console.log('No National Insurance Numbers to check');
    return [];
  }
  
  // Filter out any null, undefined, or empty NI numbers
  const validNiNumbers = niNumbers.filter(ni => ni && ni.trim() !== '');
  console.log('Valid National Insurance Numbers for database check:', validNiNumbers);
  
  if (validNiNumbers.length === 0) {
    console.log('No valid National Insurance Numbers after filtering');
    return [];
  }
  
  const { data, error } = await supabase
    .from("employees")
    .select("national_insurance_number")
    .in("national_insurance_number", validNiNumbers);
  
  if (error) {
    console.error('Error checking for duplicate National Insurance Numbers:', error);
    throw error;
  }
  
  const duplicates = data ? data.map(emp => emp.national_insurance_number) : [];
  console.log('Found duplicate National Insurance Numbers in database:', duplicates);
  
  return duplicates;
};

/**
 * Check for duplicate payroll IDs within the import data itself
 */
export const checkDuplicatesInImportData = (payrollIds: string[]): string[] => {
  console.log('Checking for internal duplicates in payroll IDs:', payrollIds);
  
  if (!payrollIds || payrollIds.length === 0) {
    console.log('No payroll IDs to check for internal duplicates');
    return [];
  }
  
  // Filter out null, undefined, or empty values first
  const validPayrollIds = payrollIds.filter(id => id && id.trim() !== '');
  console.log('Valid payroll IDs for internal duplicate check:', validPayrollIds);
  
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  
  for (const id of validPayrollIds) {
    const normalizedId = id.trim();
    console.log(`Processing payroll ID: "${id}" -> normalized: "${normalizedId}"`);
    
    if (seen.has(normalizedId)) {
      console.log(`Found internal duplicate: "${normalizedId}"`);
      duplicates.add(normalizedId);
    } else {
      seen.add(normalizedId);
    }
  }
  
  const result = Array.from(duplicates);
  console.log('Internal duplicates found:', result);
  
  return result;
};

/**
 * Check for duplicate emails within the import data itself
 */
export const checkDuplicateEmailsInImportData = (emails: string[]): string[] => {
  console.log('Checking for internal duplicates in emails:', emails);
  
  if (!emails || emails.length === 0) {
    console.log('No emails to check for internal duplicates');
    return [];
  }
  
  // Filter out null, undefined, or empty values first
  const validEmails = emails.filter(email => email && email.trim() !== '');
  console.log('Valid emails for internal duplicate check:', validEmails);
  
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  
  for (const email of validEmails) {
    const normalizedEmail = email.trim().toLowerCase();
    console.log(`Processing email: "${email}" -> normalized: "${normalizedEmail}"`);
    
    if (seen.has(normalizedEmail)) {
      console.log(`Found internal duplicate: "${normalizedEmail}"`);
      duplicates.add(normalizedEmail);
    } else {
      seen.add(normalizedEmail);
    }
  }
  
  const result = Array.from(duplicates);
  console.log('Internal email duplicates found:', result);
  
  return result;
};

/**
 * Check for duplicate National Insurance Numbers within the import data itself
 */
export const checkDuplicateNationalInsuranceNumbersInImportData = (niNumbers: string[]): string[] => {
  console.log('Checking for internal duplicates in National Insurance Numbers:', niNumbers);
  
  if (!niNumbers || niNumbers.length === 0) {
    console.log('No National Insurance Numbers to check for internal duplicates');
    return [];
  }
  
  // Filter out null, undefined, or empty values first
  const validNiNumbers = niNumbers.filter(ni => ni && ni.trim() !== '');
  console.log('Valid National Insurance Numbers for internal duplicate check:', validNiNumbers);
  
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  
  for (const ni of validNiNumbers) {
    const normalizedNi = ni.trim().toUpperCase();
    console.log(`Processing National Insurance Number: "${ni}" -> normalized: "${normalizedNi}"`);
    
    if (seen.has(normalizedNi)) {
      console.log(`Found internal duplicate: "${normalizedNi}"`);
      duplicates.add(normalizedNi);
    } else {
      seen.add(normalizedNi);
    }
  }
  
  const result = Array.from(duplicates);
  console.log('Internal National Insurance Number duplicates found:', result);
  
  return result;
};

/**
 * Comprehensive duplicate checking for all unique identifiers
 */
export interface DuplicateCheckResult {
  hasInternalDuplicates: boolean;
  hasDatabaseDuplicates: boolean;
  internalDuplicates: {
    payrollIds: string[];
    emails: string[];
    nationalInsuranceNumbers: string[];
  };
  databaseDuplicates: {
    payrollIds: string[];
    emails: string[];
    nationalInsuranceNumbers: string[];
  };
}

export const performComprehensiveDuplicateCheck = async (
  importData: any[]
): Promise<DuplicateCheckResult> => {
  console.log('Performing comprehensive duplicate check for', importData.length, 'records');
  
  // Extract all unique identifiers from import data
  const payrollIds = importData
    .map(emp => emp.payroll_id)
    .filter(id => id && id.trim() !== '');
  
  const emails = importData
    .map(emp => emp.email)
    .filter(email => email && email.trim() !== '');
  
  const nationalInsuranceNumbers = importData
    .map(emp => emp.national_insurance_number)
    .filter(ni => ni && ni.trim() !== '');
  
  // Check for internal duplicates
  const internalPayrollDuplicates = checkDuplicatesInImportData(payrollIds);
  const internalEmailDuplicates = checkDuplicateEmailsInImportData(emails);
  const internalNiDuplicates = checkDuplicateNationalInsuranceNumbersInImportData(nationalInsuranceNumbers);
  
  // Check for database duplicates
  const [databasePayrollDuplicates, databaseEmailDuplicates, databaseNiDuplicates] = await Promise.all([
    checkDuplicatePayrollIds(payrollIds),
    checkDuplicateEmails(emails),
    checkDuplicateNationalInsuranceNumbers(nationalInsuranceNumbers)
  ]);
  
  const result: DuplicateCheckResult = {
    hasInternalDuplicates: internalPayrollDuplicates.length > 0 || 
                          internalEmailDuplicates.length > 0 || 
                          internalNiDuplicates.length > 0,
    hasDatabaseDuplicates: databasePayrollDuplicates.length > 0 || 
                          databaseEmailDuplicates.length > 0 || 
                          databaseNiDuplicates.length > 0,
    internalDuplicates: {
      payrollIds: internalPayrollDuplicates,
      emails: internalEmailDuplicates,
      nationalInsuranceNumbers: internalNiDuplicates
    },
    databaseDuplicates: {
      payrollIds: databasePayrollDuplicates,
      emails: databaseEmailDuplicates,
      nationalInsuranceNumbers: databaseNiDuplicates
    }
  };
  
  console.log('Comprehensive duplicate check result:', result);
  return result;
};
