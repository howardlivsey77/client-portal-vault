
import { supabase } from "@/integrations/supabase/client";
import { EmployeeHoursData } from '@/components/payroll/types';
import { roundToTwoDecimals } from '@/lib/formatters';
import { getSavedAliases } from './employeeNameAliases';

export interface EmployeeMatchCandidate {
  id: string;
  first_name: string;
  last_name: string;
  payroll_id?: string;
  email?: string;
  full_name: string;
  confidence: number;
  hourly_rate?: number | null;
  rate_2?: number | null;
  rate_3?: number | null;
  rate_4?: number | null;
}

export interface EmployeeMatchResult {
  employeeData: EmployeeHoursData;
  matchType: 'exact' | 'fuzzy' | 'unmatched' | 'alias';
  candidates: EmployeeMatchCandidate[];
  selectedMatch?: EmployeeMatchCandidate;
  matchedViaAlias?: boolean;
}

export interface EmployeeMatchingResults {
  exactMatches: EmployeeMatchResult[];
  fuzzyMatches: EmployeeMatchResult[];
  unmatchedEmployees: EmployeeMatchResult[];
  allDatabaseEmployees: EmployeeMatchCandidate[];
  aliasMatchCount: number;
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Extract first name and last name from employee name string
 */
function parseEmployeeName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName) return { firstName: '', lastName: '' };
  
  const nameParts = fullName.trim().split(/\s+/);
  
  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: '' };
  } else if (nameParts.length === 2) {
    return { firstName: nameParts[0], lastName: nameParts[1] };
  } else {
    // For names with more than 2 parts, assume first is first name, rest is last name
    return { 
      firstName: nameParts[0], 
      lastName: nameParts.slice(1).join(' ') 
    };
  }
}

/**
 * Find matching candidates for an employee from the payroll file
 */
function findMatchingCandidates(
  employeeData: EmployeeHoursData,
  databaseEmployees: EmployeeMatchCandidate[]
): EmployeeMatchCandidate[] {
  const { firstName, lastName } = parseEmployeeName(employeeData.employeeName);
  const candidates: EmployeeMatchCandidate[] = [];
  
  // PRIORITY 1: Check for exact email match first (highest priority)
  if (employeeData.email) {
    const normalizedFileEmail = employeeData.email.toLowerCase().trim();
    
    for (const dbEmployee of databaseEmployees) {
      if (dbEmployee.email) {
        const normalizedDbEmail = dbEmployee.email.toLowerCase().trim();
        
        if (normalizedFileEmail === normalizedDbEmail) {
          // Exact email match - this is definitive!
          console.log(`✅ EXACT EMAIL MATCH: ${employeeData.employeeName} matched to ${dbEmployee.full_name} via email ${normalizedFileEmail}`);
          
          candidates.push({
            ...dbEmployee,
            confidence: 1.0
          });
          
          // Return immediately - email match is definitive, no need to check names
          return candidates;
        }
      }
    }
  }
  
  // PRIORITY 2: If no email match, fall back to name-based matching
  console.log(`No email match for ${employeeData.employeeName}, using name-based matching...`);
  
  for (const dbEmployee of databaseEmployees) {
    let confidence = 0;
    
    // Exact name match
    if (dbEmployee.full_name.toLowerCase() === employeeData.employeeName.toLowerCase()) {
      confidence = 1.0;
    } else {
      // Calculate similarity based on first and last names
      const firstNameSimilarity = calculateSimilarity(firstName, dbEmployee.first_name);
      const lastNameSimilarity = calculateSimilarity(lastName, dbEmployee.last_name);
      const fullNameSimilarity = calculateSimilarity(employeeData.employeeName, dbEmployee.full_name);
      
      // Take the best similarity score
      confidence = Math.max(
        (firstNameSimilarity + lastNameSimilarity) / 2,
        fullNameSimilarity
      );
    }
    
    // Only include candidates with reasonable similarity (lowered from 0.6 to catch near-matches like typos)
    if (confidence > 0.5) {
      candidates.push({
        ...dbEmployee,
        confidence
      });
    }
  }
  
  // Sort by confidence (highest first)
  return candidates.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Match employees from payroll file with database employees
 * @param employeeHoursData - Array of employee hours data from payroll file
 * @param companyId - Optional company ID to check for saved name aliases
 */
export async function matchEmployees(
  employeeHoursData: EmployeeHoursData[],
  companyId?: string
): Promise<EmployeeMatchingResults> {
  try {
    // Fetch saved aliases if companyId is provided
    const savedAliases = companyId ? await getSavedAliases(companyId) : {};
    const hasAliases = Object.keys(savedAliases).length > 0;
    
    if (hasAliases) {
      console.log(`Loaded ${Object.keys(savedAliases).length} saved employee name aliases`);
    }

    // Fetch all employees from database
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, first_name, last_name, payroll_id, email, hourly_rate, rate_2, rate_3, rate_4');

    if (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
    
    const databaseEmployees: EmployeeMatchCandidate[] = (employees || []).map(emp => ({
      id: emp.id,
      first_name: emp.first_name || '',
      last_name: emp.last_name || '',
      payroll_id: emp.payroll_id,
      email: emp.email,
      full_name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
      confidence: 0,
      hourly_rate: (emp as any).hourly_rate ?? null,
      rate_2: (emp as any).rate_2 ?? null,
      rate_3: (emp as any).rate_3 ?? null,
      rate_4: (emp as any).rate_4 ?? null,
    }));

    // Sort employees alphabetically by last name, then first name
    databaseEmployees.sort((a, b) => {
      if (a.last_name !== b.last_name) {
        return a.last_name.localeCompare(b.last_name);
      }
      return a.first_name.localeCompare(b.first_name);
    });

    const exactMatches: EmployeeMatchResult[] = [];
    const fuzzyMatches: EmployeeMatchResult[] = [];
    const unmatchedEmployees: EmployeeMatchResult[] = [];
    let aliasMatchCount = 0;
    
    // Process each employee from the payroll file
    for (const employeeData of employeeHoursData) {
      // PRIORITY 0: Check saved aliases first (highest priority)
      const normalizedName = employeeData.employeeName.toLowerCase().trim();
      const aliasEmployeeId = savedAliases[normalizedName];
      
      if (aliasEmployeeId) {
        const aliasEmployee = databaseEmployees.find(emp => emp.id === aliasEmployeeId);
        if (aliasEmployee) {
          console.log(`✅ ALIAS MATCH: "${employeeData.employeeName}" matched to ${aliasEmployee.full_name} via saved alias`);
          exactMatches.push({
            employeeData,
            matchType: 'exact',
            candidates: [{ ...aliasEmployee, confidence: 1.0 }],
            selectedMatch: { ...aliasEmployee, confidence: 1.0 },
            matchedViaAlias: true
          });
          aliasMatchCount++;
          continue;
        }
      }
      
      // PRIORITY 1-2: Check email and name matching
      const candidates = findMatchingCandidates(employeeData, databaseEmployees);
      
      let matchResult: EmployeeMatchResult;
      
      if (candidates.length === 0) {
        // No matches found
        matchResult = {
          employeeData,
          matchType: 'unmatched',
          candidates: []
        };
        unmatchedEmployees.push(matchResult);
      } else if (candidates[0].confidence === 1.0) {
        // Exact match found
        matchResult = {
          employeeData,
          matchType: 'exact',
          candidates,
          selectedMatch: candidates[0]
        };
        exactMatches.push(matchResult);
      } else {
        // Fuzzy matches found
        matchResult = {
          employeeData,
          matchType: 'fuzzy',
          candidates
        };
        fuzzyMatches.push(matchResult);
      }
    }
    
    console.log(`Employee matching results: ${exactMatches.length} exact (${aliasMatchCount} via aliases), ${fuzzyMatches.length} fuzzy, ${unmatchedEmployees.length} unmatched`);
    
    // Log breakdown of exact match methods
    const emailMatches = exactMatches.filter(m => 
      !m.matchedViaAlias && m.employeeData.email && m.selectedMatch?.email && 
      m.employeeData.email.toLowerCase() === m.selectedMatch.email.toLowerCase()
    ).length;
    const nameMatches = exactMatches.length - emailMatches - aliasMatchCount;
    
    console.log(`  └─ Exact matches breakdown: ${aliasMatchCount} via saved aliases, ${emailMatches} via email, ${nameMatches} via name`);
    
    return {
      exactMatches,
      fuzzyMatches,
      unmatchedEmployees,
      allDatabaseEmployees: databaseEmployees,
      aliasMatchCount
    };
  } catch (error) {
    console.error('Error in employee matching:', error);
    throw error;
  }
}

/**
 * Apply rate to an employee hours entry based on its rateType and DB employee rates
 */
function applyRateToEmployeeHours(empHours: any, dbEmployee: { hourly_rate?: number | null; rate_2?: number | null; rate_3?: number | null; rate_4?: number | null; }) {
  if (!empHours) return;
  const safe = (v: any) => (typeof v === 'number' ? v : (v ? Number(v) : 0));

  if (empHours.rateType) {
    let rateNumber: number | null = null;
    const match = String(empHours.rateType).match(/Rate\s*(\d+)/i);
    if (match) rateNumber = parseInt(match[1], 10);

    if (rateNumber) {
      switch (rateNumber) {
        case 1:
          empHours.rateValue = roundToTwoDecimals(safe(dbEmployee.hourly_rate));
          break;
        case 2:
          empHours.rateValue = roundToTwoDecimals(safe(dbEmployee.rate_2)) || roundToTwoDecimals(safe(dbEmployee.hourly_rate));
          break;
        case 3:
          empHours.rateValue = roundToTwoDecimals(safe(dbEmployee.rate_3));
          break;
        case 4:
          empHours.rateValue = roundToTwoDecimals(safe(dbEmployee.rate_4));
          break;
        default:
          empHours.rateValue = roundToTwoDecimals(safe(dbEmployee.hourly_rate));
      }
    } else if (String(empHours.rateType).toLowerCase() === 'standard') {
      empHours.rateValue = roundToTwoDecimals(safe(dbEmployee.hourly_rate));
    } else {
      empHours.rateValue = roundToTwoDecimals(safe(dbEmployee.hourly_rate));
    }
  } else {
    empHours.rateValue = roundToTwoDecimals(safe(dbEmployee.hourly_rate));
  }
}

/**
 * Apply user-selected mappings to the matching results and enrich with rates
 */
export function applyUserMappings(
  matchingResults: EmployeeMatchingResults,
  userMappings: Record<string, string>
): EmployeeHoursData[] {
  const finalEmployeeData: EmployeeHoursData[] = [];

  // Process exact matches (automatically mapped)
  for (const match of matchingResults.exactMatches) {
    if (match.selectedMatch) {
      const enriched = {
        ...match.employeeData,
        employeeId: match.selectedMatch.id,
        payrollId: match.selectedMatch.payroll_id
      } as any;
      applyRateToEmployeeHours(enriched, match.selectedMatch);
      finalEmployeeData.push(enriched);
    }
  }

  // Process fuzzy matches and unmatched employees with user mappings
  const allPendingMatches = [...matchingResults.fuzzyMatches, ...matchingResults.unmatchedEmployees];

  for (const match of allPendingMatches) {
    const employeeName = match.employeeData.employeeName;
    const selectedEmployeeId = userMappings[employeeName];

    if (selectedEmployeeId) {
      const selectedEmployee = matchingResults.allDatabaseEmployees.find(emp => emp.id === selectedEmployeeId);
      if (selectedEmployee) {
        const enriched = {
          ...match.employeeData,
          employeeId: selectedEmployee.id,
          payrollId: selectedEmployee.payroll_id
        } as any;
        applyRateToEmployeeHours(enriched, selectedEmployee);
        finalEmployeeData.push(enriched);
      }
    }
    // If no mapping selected, skip this employee (user chose not to include them)
  }

  return finalEmployeeData;
}
