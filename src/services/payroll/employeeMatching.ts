
import { supabase } from "@/integrations/supabase/client";
import { EmployeeHoursData } from '@/components/payroll/types';

export interface EmployeeMatchCandidate {
  id: string;
  first_name: string;
  last_name: string;
  payroll_id?: string;
  email?: string;
  full_name: string;
  confidence: number;
}

export interface EmployeeMatchResult {
  employeeData: EmployeeHoursData;
  matchType: 'exact' | 'fuzzy' | 'unmatched';
  candidates: EmployeeMatchCandidate[];
  selectedMatch?: EmployeeMatchCandidate;
}

export interface EmployeeMatchingResults {
  exactMatches: EmployeeMatchResult[];
  fuzzyMatches: EmployeeMatchResult[];
  unmatchedEmployees: EmployeeMatchResult[];
  allDatabaseEmployees: EmployeeMatchCandidate[];
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
    
    // Only include candidates with reasonable similarity
    if (confidence > 0.6) {
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
 */
export async function matchEmployees(employeeHoursData: EmployeeHoursData[]): Promise<EmployeeMatchingResults> {
  try {
    // Fetch all employees from database
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, first_name, last_name, payroll_id, email');
      
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
      confidence: 0
    }));
    
    const exactMatches: EmployeeMatchResult[] = [];
    const fuzzyMatches: EmployeeMatchResult[] = [];
    const unmatchedEmployees: EmployeeMatchResult[] = [];
    
    // Process each employee from the payroll file
    for (const employeeData of employeeHoursData) {
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
    
    console.log(`Employee matching results: ${exactMatches.length} exact, ${fuzzyMatches.length} fuzzy, ${unmatchedEmployees.length} unmatched`);
    
    return {
      exactMatches,
      fuzzyMatches,
      unmatchedEmployees,
      allDatabaseEmployees: databaseEmployees
    };
  } catch (error) {
    console.error('Error in employee matching:', error);
    throw error;
  }
}

/**
 * Apply user-selected mappings to the matching results
 */
export function applyUserMappings(
  matchingResults: EmployeeMatchingResults,
  userMappings: Record<string, string>
): EmployeeHoursData[] {
  const finalEmployeeData: EmployeeHoursData[] = [];
  
  // Process exact matches (automatically mapped)
  for (const match of matchingResults.exactMatches) {
    if (match.selectedMatch) {
      finalEmployeeData.push({
        ...match.employeeData,
        employeeId: match.selectedMatch.id,
        payrollId: match.selectedMatch.payroll_id
      });
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
        finalEmployeeData.push({
          ...match.employeeData,
          employeeId: selectedEmployee.id,
          payrollId: selectedEmployee.payroll_id
        });
      }
    }
    // If no mapping selected, skip this employee (user chose not to include them)
  }
  
  return finalEmployeeData;
}
