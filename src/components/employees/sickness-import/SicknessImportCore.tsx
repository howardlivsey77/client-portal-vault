import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Upload, FileText, Users, CheckCircle, AlertCircle, Clock, X, Search, Filter, UserCheck, UserX, Download } from "lucide-react";
import { useToast, useEmployees } from "@/hooks";
import { supabase } from "@/integrations/supabase/client";
import { useSicknessSchemes } from "@/features/company-settings/hooks/useSicknessSchemes";
import { parseDate, formatDateForDB } from "@/utils/dateParser";
import * as XLSX from 'xlsx';
import Fuse from 'fuse.js';
import { SicknessImportCoreProps, ProcessedSicknessRecord, ImportStep } from './types';
import { overlapService } from '@/services/employees/sickness/overlapService';
import { processRecordsWithAutoTrim } from '@/utils/sicknessImport/autoTrimmer';
import { OverlapTrimView } from './OverlapTrimView';
import { FinalReviewView } from './FinalReviewView';

export const SicknessImportCore = ({ mode = 'standalone', onComplete, onCancel }: SicknessImportCoreProps) => {
  // File handling states
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [isImporting, setIsImporting] = useState(false);
  
  // Data states
  const [sicknessRecords, setSicknessRecords] = useState<ProcessedSicknessRecord[]>([]);
  const [skipAllUnmatched, setSkipAllUnmatched] = useState(false);
  const [schemeSkipAllUnmatched, setSchemeSkipAllUnmatched] = useState(false);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'needs_attention' | 'skipped'>('all');
  
  // Import result states
  const [importResult, setImportResult] = useState<{
    processed: number;
    failed: number;
    failedRecords: Array<{record: ProcessedSicknessRecord, error: string}>;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { employees } = useEmployees();
  const { schemes } = useSicknessSchemes();

  // Enhanced fuzzy search setup for employees (surname priority)
  const employeeFuse = new Fuse(employees, {
    keys: [
      { name: 'last_name', weight: 0.7 },
      { name: 'first_name', weight: 0.3 },
      { name: 'payroll_id', weight: 0.5 }
    ],
    threshold: 0.3,
    includeScore: true,
    minMatchCharLength: 2
  });

  // Fuzzy search for schemes
  const schemeFuse = new Fuse(schemes, {
    keys: ['name'],
    threshold: 0.4,
    includeScore: true
  });

  // Enhanced name parsing and matching with multiple strategies
  const parseEmployeeName = (fullName: string) => {
    const normalized = fullName.trim().toLowerCase().replace(/[.,'"]/g, '');
    
    let firstName = '';
    let surname = '';
    
    if (normalized.includes(', ')) {
      // "Surname, First Name" format
      const [lastPart, firstPart] = normalized.split(', ');
      surname = lastPart.trim();
      firstName = firstPart.trim();
    } else {
      // "First Name Surname" or single name format
      const nameParts = normalized.split(' ').filter(part => part.length > 0);
      if (nameParts.length === 1) {
        // Single name - could be first or last
        firstName = nameParts[0];
        surname = nameParts[0]; // Try as both
      } else {
        firstName = nameParts[0];
        surname = nameParts.slice(1).join(' ');
      }
    }
    
    return { firstName, surname, normalized };
  };

  // Helper function to calculate Levenshtein distance
  const levenshteinDistance = (str1: string, str2: string): number => {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }
    return dp[m][n];
  };

  // Helper function to check if two names are similar
  const areNamesSimilar = (name1: string, name2: string): boolean => {
    if (!name1 || !name2) return false;
    
    // Exact match
    if (name1 === name2) return true;
    
    // One contains the other (for nicknames)
    if (name1.includes(name2) || name2.includes(name1)) return true;
    
    // Check Levenshtein distance (max 2 character differences for names 3+ chars)
    if (name1.length >= 3 && name2.length >= 3) {
      const distance = levenshteinDistance(name1, name2);
      const maxDistance = Math.min(2, Math.floor(Math.max(name1.length, name2.length) * 0.3));
      return distance <= maxDistance;
    }
    
    return false;
  };

  const findEmployeeMatches = (employeeName: string) => {
    if (!employeeName?.trim()) return [];
    
    const { firstName, surname } = parseEmployeeName(employeeName);
    
    if (!surname) return [];
    
    const results: Array<{
      id: string;
      name: string;
      confidence: number;
      payrollId: string | null;
      score: number;
      matchType: string;
    }> = [];
    
    // Strategy 1: Exact full name match (highest priority)
    for (const employee of employees) {
      const empFirstName = employee.first_name?.toLowerCase() || '';
      const empLastName = employee.last_name?.toLowerCase() || '';
      const empFullName = `${empFirstName} ${empLastName}`.trim();
      const searchFullName = `${firstName || ''} ${surname}`.trim();
      
      if (empFullName === searchFullName) {
        results.push({
          id: employee.id,
          name: `${employee.last_name}, ${employee.first_name}`,
          confidence: 100,
          payrollId: employee.payroll_id,
          score: 0,
          matchType: 'exact_full_name'
        });
      }
    }
    
    // If we found exact matches, return only those
    if (results.length > 0) {
      return results;
    }
    
    // Strategy 2: Exact surname + exact first name match
    if (firstName) {
      for (const employee of employees) {
        const empFirstName = employee.first_name?.toLowerCase() || '';
        const empLastName = employee.last_name?.toLowerCase() || '';
        
        if (empLastName === surname && empFirstName === firstName) {
          results.push({
            id: employee.id,
            name: `${employee.last_name}, ${employee.first_name}`,
            confidence: 95,
            payrollId: employee.payroll_id,
            score: 0,
            matchType: 'exact_names'
          });
        }
      }
      
      if (results.length > 0) {
        return results;
      }
    }
    
    // Strategy 3: Exact surname + similar first name
    if (firstName) {
      for (const employee of employees) {
        const empFirstName = employee.first_name?.toLowerCase() || '';
        const empLastName = employee.last_name?.toLowerCase() || '';
        
        if (empLastName === surname && areNamesSimilar(empFirstName, firstName)) {
          // Calculate similarity score for confidence
          const distance = levenshteinDistance(empFirstName, firstName);
          const maxLen = Math.max(empFirstName.length, firstName.length);
          const similarity = 1 - (distance / maxLen);
          const confidence = Math.round(60 + (similarity * 20)); // 60-80% range
          
          results.push({
            id: employee.id,
            name: `${employee.last_name}, ${employee.first_name}`,
            confidence: Math.min(80, confidence),
            payrollId: employee.payroll_id,
            score: distance,
            matchType: 'exact_surname_similar_first'
          });
        }
      }
    }
    
    // Strategy 4: Similar surname + exact first name
    if (firstName) {
      for (const employee of employees) {
        const empFirstName = employee.first_name?.toLowerCase() || '';
        const empLastName = employee.last_name?.toLowerCase() || '';
        
        if (empFirstName === firstName && areNamesSimilar(empLastName, surname)) {
          // Calculate similarity score for confidence
          const distance = levenshteinDistance(empLastName, surname);
          const maxLen = Math.max(empLastName.length, surname.length);
          const similarity = 1 - (distance / maxLen);
          const confidence = Math.round(50 + (similarity * 20)); // 50-70% range
          
          results.push({
            id: employee.id,
            name: `${employee.last_name}, ${employee.first_name}`,
            confidence: Math.min(70, confidence),
            payrollId: employee.payroll_id,
            score: distance,
            matchType: 'similar_surname_exact_first'
          });
        }
      }
    }
    
    // Strategy 5: Exact surname only (when we have multiple Williams, be very careful)
    const surnameMatches = employees.filter(emp => 
      emp.last_name?.toLowerCase() === surname
    );
    
    if (surnameMatches.length === 1 && !firstName) {
      // Only one person with this surname and no first name provided
      const employee = surnameMatches[0];
      results.push({
        id: employee.id,
        name: `${employee.last_name}, ${employee.first_name}`,
        confidence: 75,
        payrollId: employee.payroll_id,
        score: 0,
        matchType: 'unique_surname'
      });
    } else if (surnameMatches.length > 1 && firstName) {
      // Multiple people with same surname - check if any first names are reasonably close
      for (const employee of surnameMatches) {
        const empFirstName = employee.first_name?.toLowerCase() || '';
        
        // Only include if first names have some similarity (at least reasonable match)
        if (empFirstName && areNamesSimilar(empFirstName, firstName)) {
          const distance = levenshteinDistance(empFirstName, firstName);
          const maxLen = Math.max(empFirstName.length, firstName.length);
          const similarity = 1 - (distance / maxLen);
          
          // Lower confidence for surname-only context when multiple people exist
          const confidence = Math.round(30 + (similarity * 20)); // 30-50% range
          
          results.push({
            id: employee.id,
            name: `${employee.last_name}, ${employee.first_name}`,
            confidence: Math.min(50, confidence),
            payrollId: employee.payroll_id,
            score: distance,
            matchType: 'surname_with_similar_first'
          });
        }
      }
    }
    
    // Strategy 6: Fuzzy search as last resort (very low confidence)
    if (results.length === 0) {
      const fuse = new Fuse(employees, {
        keys: ['last_name', 'first_name'],
        threshold: 0.4,
        includeScore: true,
        ignoreLocation: true,
        findAllMatches: true
      });
      
      const fuzzyResults = fuse.search(employeeName);
      
      for (const result of fuzzyResults.slice(0, 3)) {
        const confidence = Math.round((1 - (result.score || 0)) * 40); // Max 40% for fuzzy
        
        if (confidence >= 20) {
          results.push({
            id: result.item.id,
            name: `${result.item.last_name}, ${result.item.first_name}`,
            confidence,
            payrollId: result.item.payroll_id,
            score: result.score || 0,
            matchType: 'fuzzy'
          });
        }
      }
    }
    
    // Remove duplicates and sort by confidence
    const uniqueResults = new Map();
    for (const result of results) {
      const existing = uniqueResults.get(result.id);
      if (!existing || result.confidence > existing.confidence) {
        uniqueResults.set(result.id, result);
      }
    }
    
    return Array.from(uniqueResults.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  };

  const findSchemeMatch = (schemeName: string, employeeId?: string) => {
    // First try to match from import file if scheme is provided
    if (schemeName?.trim()) {
      const results = schemeFuse.search(schemeName);
      if (results.length > 0 && results[0].score! < 0.6) {
        return results[0].item.name;
      }
    }
    
    // Fall back to employee's existing assigned scheme
    if (employeeId) {
      const employee = employees.find(e => e.id === employeeId);
      if (employee?.sickness_scheme_id) {
        const assignedScheme = schemes.find(s => s.id === employee.sickness_scheme_id);
        return assignedScheme?.name || null;
      }
    }
    
    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setCurrentStep('upload');
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setImportProgress(0);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        throw new Error('File must contain at least a header row and one data row');
      }

      const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
      const rows = jsonData.slice(1);

      setImportProgress(25);

      // Find column indices
      const employeeNameIndex = headers.findIndex(h => 
        h.includes('name') || h.includes('employee')
      );
      const sicknessDaysIndex = headers.findIndex(h => 
        h.includes('days') || h.includes('sick')
      );
      const schemeIndex = headers.findIndex(h => 
        h.includes('scheme') || h.includes('allocation')
      );
      const startDateIndex = headers.findIndex(h => 
        h.includes('start') && h.includes('date')
      );
      const endDateIndex = headers.findIndex(h => 
        h.includes('end') && h.includes('date')
      );
      const reasonIndex = headers.findIndex(h => 
        h.includes('reason') || h.includes('description')
      );
      const certifiedIndex = headers.findIndex(h => 
        h.includes('certified') || h.includes('certificate')
      );
      const notesIndex = headers.findIndex(h => 
        h.includes('notes') || h.includes('comment')
      );

      if (employeeNameIndex === -1) {
        throw new Error('Could not find employee name column');
      }
      
      // Sickness days column is now optional - can be calculated from dates and work patterns
      const hasSicknessDaysColumn = sicknessDaysIndex !== -1;

      setImportProgress(50);

      // Pre-process work patterns for employees to avoid async issues in map
      const employeeWorkPatterns = new Map();
      for (const employee of employees) {
        try {
          const { data: workPatterns } = await supabase
            .from('work_patterns')
            .select('day, is_working, start_time, end_time')
            .eq('employee_id', employee.id);

          if (workPatterns && workPatterns.length > 0) {
            const workPattern = workPatterns.map(wp => ({
              day: wp.day,
              isWorking: wp.is_working,
              startTime: wp.start_time || null,
              endTime: wp.end_time || null,
              payrollId: null
            }));
            employeeWorkPatterns.set(employee.id, workPattern);
            console.log(`Loaded work patterns for employee ${employee.id}:`, workPattern);
          } else {
            console.warn(`No work patterns found for employee ${employee.id}`);
          }
        } catch (error) {
          console.error(`Failed to fetch work patterns for employee ${employee.id}:`, error);
          // Set a default work pattern so import doesn't fail
          const defaultWorkPattern = [
            { day: 'Monday', isWorking: true, startTime: null, endTime: null, payrollId: null },
            { day: 'Tuesday', isWorking: true, startTime: null, endTime: null, payrollId: null },
            { day: 'Wednesday', isWorking: true, startTime: null, endTime: null, payrollId: null },
            { day: 'Thursday', isWorking: true, startTime: null, endTime: null, payrollId: null },
            { day: 'Friday', isWorking: true, startTime: null, endTime: null, payrollId: null },
            { day: 'Saturday', isWorking: false, startTime: null, endTime: null, payrollId: null },
            { day: 'Sunday', isWorking: false, startTime: null, endTime: null, payrollId: null }
          ];
          employeeWorkPatterns.set(employee.id, defaultWorkPattern);
          console.log(`Using default work pattern for employee ${employee.id}`);
        }
      }

      // Import the calculation function with error handling
      let calculateWorkingDaysForRecord;
      try {
        const module = await import('@/components/employees/details/sickness/utils/workingDaysCalculations');
        calculateWorkingDaysForRecord = module.calculateWorkingDaysForRecord;
        console.log('Successfully imported working days calculation function');
      } catch (error) {
        console.error('Failed to import working days calculation function:', error);
        // Provide a fallback calculation function
        calculateWorkingDaysForRecord = (startDate: string, endDate: string | null, workPattern: any[]) => {
          const start = new Date(startDate);
          const end = endDate ? new Date(endDate) : start;
          let workingDays = 0;
          const current = new Date(start);
          
          while (current <= end) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
              workingDays++;
            }
            current.setDate(current.getDate() + 1);
          }
          
          return workingDays;
        };
      }

      // Process each row with enhanced matching
      const filteredRows = rows.filter((row, rowIndex) => {
        const nameCell = row[employeeNameIndex];
        const hasName = nameCell !== undefined && nameCell !== null && String(nameCell).trim() !== '';
        
        if (!hasName) {
          console.log(`Row ${rowIndex + 2} skipped: No employee name`);
          return false;
        }
        
        // Accept rows with either valid sickness days OR valid start date
        if (hasSicknessDaysColumn) {
          const daysCell = row[sicknessDaysIndex];
          const daysNum = Number(daysCell);
          const hasValidDays = !isNaN(daysNum) && daysNum >= 0; // Allow 0 days
          const startDateCell = startDateIndex >= 0 ? String(row[startDateIndex] || '').trim() : '';
          const hasStartDate = startDateCell && startDateCell !== '';
          
          const isValid = hasValidDays || hasStartDate;
          if (!isValid) {
            console.log(`Row ${rowIndex + 2} skipped: No valid sickness days or start date`);
          }
          return isValid;
        } else {
          // No sickness days column - must have start date for calculation
          const startDateCell = startDateIndex >= 0 ? String(row[startDateIndex] || '').trim() : '';
          const hasStartDate = startDateCell && startDateCell !== '';
          if (!hasStartDate) {
            console.log(`Row ${rowIndex + 2} skipped: No start date for calculation`);
          }
          return hasStartDate;
        }
      });

      const processedRecords: ProcessedSicknessRecord[] = await Promise.all(
        filteredRows.map(async (row, index) => {
          const employeeName = String(row[employeeNameIndex]).trim();
          
          // Get sickness days from file if available, otherwise will be calculated
          const importedSicknessDays = hasSicknessDaysColumn ? Number(row[sicknessDaysIndex]) || 0 : undefined;
          
          const schemeAllocation = schemeIndex >= 0 ? String(row[schemeIndex] || '').trim() : '';
          
          // Extract and parse dates immediately
          const startDateRaw = startDateIndex >= 0 ? row[startDateIndex] : '';
          const endDateRaw = endDateIndex >= 0 ? row[endDateIndex] : '';
          
          // Parse dates using the robust date parser
          const startDateParsed = parseDate(startDateRaw);
          const endDateParsed = endDateRaw ? parseDate(endDateRaw) : { date: null, isValid: true, originalValue: endDateRaw };
          
          // Convert to YYYY-MM-DD format for consistency
          const startDate = startDateParsed.isValid && startDateParsed.date 
            ? formatDateForDB(startDateParsed.date)
            : '';
          const endDate = endDateParsed.isValid && endDateParsed.date
            ? formatDateForDB(endDateParsed.date)
            : '';
          
          console.log(`[Row ${index + 2}] ${employeeName}: Raw dates [${startDateRaw}, ${endDateRaw}] → Parsed [${startDate}, ${endDate}]`);
          
          const reason = reasonIndex >= 0 ? String(row[reasonIndex] || '').trim() : '';
          const isCertified = certifiedIndex >= 0 ? Boolean(row[certifiedIndex]) : false;
          const notes = notesIndex >= 0 ? String(row[notesIndex] || '').trim() : '';

          // Find employee matches
          const employeeMatches = findEmployeeMatches(employeeName);
          const bestEmployeeMatch = employeeMatches.length > 0 ? employeeMatches[0] : null;

          // Find scheme match - try import data first, then fall back to employee's assigned scheme
          const matchedSchemeName = findSchemeMatch(schemeAllocation, bestEmployeeMatch?.id);

          // Calculate working days if we have employee match and dates
          let calculatedSicknessDays = importedSicknessDays;
          if (bestEmployeeMatch?.id && startDate) {
            const workPattern = employeeWorkPatterns.get(bestEmployeeMatch.id);
            console.log(`Processing ${employeeName} - Employee ID: ${bestEmployeeMatch.id}, Work Pattern:`, workPattern);
            
            if (workPattern && workPattern.length > 0) {
              try {
                const calculatedDays = calculateWorkingDaysForRecord(
                  startDate,
                  endDate || null,
                  workPattern
                );
                
                // Use calculated days if no imported days or as validation
                if (importedSicknessDays === undefined) {
                  calculatedSicknessDays = calculatedDays;
                }
                
                console.log(`Calculated ${calculatedDays} working days for ${employeeName} (${startDate} to ${endDate || 'ongoing'})`);
              } catch (error) {
                console.warn('Could not calculate working days:', error);
              }
            } else {
              console.warn(`No work pattern found for ${employeeName} (ID: ${bestEmployeeMatch.id})`);
              // If no work pattern but we have dates, use a default calculation
              if (importedSicknessDays === undefined && startDate) {
                // Default to 5-day work week calculation
                const start = new Date(startDate);
                const end = endDate ? new Date(endDate) : start;
                let workingDays = 0;
                const current = new Date(start);
                
                while (current <= end) {
                  const dayOfWeek = current.getDay();
                  if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
                    workingDays++;
                  }
                  current.setDate(current.getDate() + 1);
                }
                
                calculatedSicknessDays = workingDays;
                console.log(`Used default calculation for ${employeeName}: ${workingDays} working days`);
              }
            }
          } else {
            console.warn(`Missing employee match or start date for ${employeeName}`);
          }

          // Check for overlapping records if we have employee and start date
          let hasOverlap = false;
          let overlapDetails = undefined;
          
          if (bestEmployeeMatch?.id && startDate) {
            try {
              const overlapResult = await overlapService.checkForOverlappingSickness(
                bestEmployeeMatch.id,
                startDate,
                endDate || undefined
              );
              
              if (overlapResult.hasOverlap) {
                hasOverlap = true;
                overlapDetails = {
                  overlappingRecords: overlapResult.overlappingRecords,
                  message: overlapResult.message
                };
                console.log(`Overlap detected for ${employeeName}:`, overlapResult.message);
              }
            } catch (error) {
              console.error(`Error checking overlaps for ${employeeName}:`, error);
            }
          }

          // Determine status - enhanced validation
          let status: 'ready' | 'needs_attention' | 'skipped' = 'ready';
          let statusReason = '';
          
          console.log(`Validating record for ${employeeName}:`, {
            bestEmployeeMatch: bestEmployeeMatch?.name,
            confidence: bestEmployeeMatch?.confidence,
            startDate,
            calculatedSicknessDays,
            schemeAllocation,
            matchedSchemeName,
            hasOverlap,
            startDateValid: startDateParsed.isValid,
            endDateValid: endDateParsed.isValid
          });
          
          // Check for invalid dates first
          if (!startDateParsed.isValid || (!startDate && calculatedSicknessDays === undefined)) {
            status = 'needs_attention';
            statusReason = `Invalid or missing start date: ${startDateParsed.error || 'No start date provided'}`;
          } else if (endDateRaw && !endDateParsed.isValid) {
            status = 'needs_attention';
            statusReason = `Invalid end date: ${endDateParsed.error}`;
          } else if (!bestEmployeeMatch) {
            status = 'needs_attention';
            statusReason = 'No employee match found';
          } else if (bestEmployeeMatch.confidence < 50) {
            status = 'needs_attention';
            statusReason = `Low confidence employee match (${bestEmployeeMatch.confidence}%)`;
          } else if (schemeAllocation && !matchedSchemeName && schemeAllocation.toLowerCase() !== 'none' && schemeAllocation.toLowerCase() !== 'n/a') {
            status = 'needs_attention';
            statusReason = `Scheme "${schemeAllocation}" not found`;
          } else if (hasOverlap) {
            status = 'skipped';
            statusReason = `Auto-skipped: ${overlapDetails?.message || 'Overlaps with existing sickness record'}`;
          }
          
          console.log(`Record status for ${employeeName}: ${status} - ${statusReason || 'Ready for import'}`);
          console.log(`Final sickness days for ${employeeName}: ${calculatedSicknessDays || 0}`);

          return {
            id: `record-${index}`,
            employeeName,
            sicknessDays: calculatedSicknessDays || 0,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            reason: reason || undefined,
            isCertified,
            notes: notes || undefined,
            schemeAllocation: schemeAllocation || undefined,
            matchedEmployeeId: bestEmployeeMatch?.id || null,
            matchedSchemeName,
            status,
            statusReason,
            confidence: bestEmployeeMatch?.confidence,
            suggestions: employeeMatches,
            hasOverlap,
            overlapDetails
          };
        })
      );

      setImportProgress(75);
      setSicknessRecords(processedRecords);
      setImportProgress(100);
      setCurrentStep('review');

      toast({
        title: "File processed successfully",
        description: `Processed ${processedRecords.length} sickness records`
      });

    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error processing file",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk actions
  const handleToggleSkipAllUnmatched = () => {
    const newSkipState = !skipAllUnmatched;
    setSkipAllUnmatched(newSkipState);
    
    setSicknessRecords(records => 
      records.map(record => ({
        ...record,
        status: (newSkipState && !record.matchedEmployeeId) ? 'skipped' : 
                (!newSkipState && record.status === 'skipped' && !record.matchedEmployeeId) ? 'needs_attention' :
                record.status
      }))
    );
  };

  const handleSchemeToggleSkipAllUnmatched = () => {
    const newSkipState = !schemeSkipAllUnmatched;
    setSchemeSkipAllUnmatched(newSkipState);
    
    setSicknessRecords(records => 
      records.map(record => ({
        ...record,
        matchedSchemeName: (newSkipState && record.schemeAllocation && !record.matchedSchemeName) ? "__skip__" :
                          (!newSkipState && record.matchedSchemeName === "__skip__") ? null :
                          record.matchedSchemeName
      }))
    );
  };

  // Manual mapping functions
  const handleManualEmployeeMapping = (recordId: string, employeeId: string | null) => {
    setSicknessRecords(records =>
      records.map(record => {
        if (record.id === recordId) {
          const updatedRecord = {
            ...record,
            matchedEmployeeId: employeeId,
            status: employeeId ? 'ready' as const : 'needs_attention' as const
          };
          return updatedRecord;
        }
        return record;
      })
    );
  };

  const handleManualSchemeMapping = (recordId: string, schemeName: string | null) => {
    setSicknessRecords(records =>
      records.map(record => 
        record.id === recordId 
          ? { ...record, matchedSchemeName: schemeName }
          : record
      )
    );
  };

  // Handler to proceed from review to overlap detection
  const handleProceedFromReview = async () => {
    setIsProcessing(true);
    try {
      // Process records with auto-trim
      const trimmedRecords = await processRecordsWithAutoTrim(
        sicknessRecords,
        async (employeeId, startDate, endDate) => {
          return await overlapService.checkForOverlappingSickness(
            employeeId,
            startDate,
            endDate
          );
        },
        async (employeeId) => {
          // Fetch work pattern for employee
          const { data: workPatternData } = await supabase
            .from('work_patterns')
            .select('day, is_working, start_time, end_time')
            .eq('employee_id', employeeId);
          
          // Map to WorkDay type
          return workPatternData?.map(wp => ({
            day: wp.day,
            isWorking: wp.is_working,
            startTime: wp.start_time || '',
            endTime: wp.end_time || '',
            payrollId: ''
          })) || [];
        }
      );

      setSicknessRecords(trimmedRecords);
      setCurrentStep('overlap-trim');
      
      toast({
        title: "Overlap detection complete",
        description: `Processed ${trimmedRecords.length} records`
      });
    } catch (error) {
      console.error('Error during overlap detection:', error);
      toast({
        title: "Error processing overlaps",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler to proceed from overlap-trim to final review
  const handleProceedFromOverlapTrim = () => {
    setCurrentStep('final-review');
  };

  // Import functionality
  const handleImport = async () => {
    setIsImporting(true);
    const readyRecords = sicknessRecords.filter(record => 
      record.status === 'ready' && record.matchedEmployeeId && record.trimStatus !== 'fully_overlapping'
    );

    if (readyRecords.length === 0) {
      toast({
        title: "No records to import",
        description: "Please ensure at least one record has a matched employee",
        variant: "destructive"
      });
      return;
    }

    setImportProgress(0);

    console.log(`Starting import of ${readyRecords.length} sickness records for The Swan Practice`);
    
    try {
      let processed = 0;
      let failed = 0;
      const total = readyRecords.length;
      const failedRecords: Array<{record: ProcessedSicknessRecord, error: string}> = [];

      for (const record of readyRecords) {
        try {
          console.log(`Processing record for ${record.employeeName}: ${record.sicknessDays} days, Start: ${record.startDate}, End: ${record.endDate}`);
          console.log(`Record details:`, {
            matchedEmployeeId: record.matchedEmployeeId,
            matchedSchemeName: record.matchedSchemeName,
            status: record.status,
            confidence: record.confidence
          });
          
          // Update employee's sickness scheme if provided and not skipped
          if (record.matchedSchemeName && record.matchedSchemeName !== "__skip__") {
            const scheme = schemes.find(s => s.name === record.matchedSchemeName);
            if (scheme) {
              console.log(`Updating employee ${record.matchedEmployeeId} with scheme: ${scheme.name}`);
              const { error: schemeError } = await supabase
                .from('employees')
                .update({ sickness_scheme_id: scheme.id })
                .eq('id', record.matchedEmployeeId);
              
              if (schemeError) {
                console.error(`Failed to update scheme for employee ${record.matchedEmployeeId}:`, schemeError);
              }
            }
          }

          // Get employee data for company_id
          const { data: employeeData, error: employeeError } = await supabase
            .from('employees')
            .select('company_id, first_name, last_name')
            .eq('id', record.matchedEmployeeId)
            .single();

          if (employeeError || !employeeData) {
            throw new Error(`Employee not found: ${employeeError?.message || 'Unknown error'}`);
          }

          console.log(`Found employee: ${employeeData.first_name} ${employeeData.last_name}, Company ID: ${employeeData.company_id}`);

          // Parse and validate dates
          const startDateParsed = parseDate(record.startDate);
          const endDateParsed = record.endDate ? parseDate(record.endDate) : { date: null, isValid: true, originalValue: null };

          // Skip record if start date is invalid
          if (!startDateParsed.isValid || !startDateParsed.date) {
            throw new Error(`Invalid start date: ${record.startDate}`);
          }

          // Skip record if end date is provided but invalid
          if (record.endDate && !endDateParsed.isValid) {
            throw new Error(`Invalid end date: ${record.endDate}`);
          }

          // Get employee's work pattern to calculate working days
          const { data: workPatterns, error: workPatternError } = await supabase
            .from('work_patterns')
            .select('day, is_working, start_time, end_time')
            .eq('employee_id', record.matchedEmployeeId);

          if (workPatternError) {
            console.warn(`Could not fetch work pattern for employee ${record.matchedEmployeeId}:`, workPatternError);
          }

          // Calculate actual working days based on work pattern
          let calculatedWorkingDays = record.sicknessDays; // fallback to imported value
          
          console.log(`Work patterns found for ${record.employeeName}:`, workPatterns?.length || 0);
          
          if (workPatterns && workPatterns.length > 0) {
            const { calculateWorkingDaysForRecord } = await import('@/components/employees/details/sickness/utils/workingDaysCalculations');
            
            const workPattern = workPatterns.map(wp => ({
              day: wp.day,
              isWorking: wp.is_working,
              startTime: wp.start_time || '',
              endTime: wp.end_time || '',
              payrollId: '' // not needed for calculation
            }));
            
            console.log(`Work pattern for ${record.employeeName}:`, workPattern);
            
            calculatedWorkingDays = calculateWorkingDaysForRecord(
              formatDateForDB(startDateParsed.date),
              endDateParsed.date ? formatDateForDB(endDateParsed.date) : null,
              workPattern
            );
            
            console.log(`Calculated working days for ${record.employeeName}: ${calculatedWorkingDays} (was ${record.sicknessDays})`);
          } else {
            console.warn(`No work patterns found for ${record.employeeName}, using default calculation`);
            // Use default 5-day work week if no pattern exists
            if (calculatedWorkingDays === undefined || calculatedWorkingDays === 0) {
              const start = new Date(formatDateForDB(startDateParsed.date));
              const end = endDateParsed.date ? new Date(formatDateForDB(endDateParsed.date)) : start;
              let workingDays = 0;
              const current = new Date(start);
              
              while (current <= end) {
                const dayOfWeek = current.getDay();
                if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
                  workingDays++;
                }
                current.setDate(current.getDate() + 1);
              }
              
              calculatedWorkingDays = workingDays;
              console.log(`Used default calculation for ${record.employeeName}: ${workingDays} working days`);
            }
          }

          // Create actual sickness record
          const sicknessRecord = {
            employee_id: record.matchedEmployeeId!,
            company_id: employeeData.company_id,
            start_date: formatDateForDB(startDateParsed.date),
            end_date: endDateParsed.date ? formatDateForDB(endDateParsed.date) : null,
            total_days: calculatedWorkingDays,
            is_certified: record.isCertified || false,
            certification_required_from_day: 8,
            reason: record.reason || null,
            notes: record.notes || null
          };

          console.log('Creating sickness record:', sicknessRecord);

          const { data: insertedRecord, error: sicknessError } = await supabase
            .from('employee_sickness_records')
            .insert(sicknessRecord)
            .select()
            .single();

          if (sicknessError) {
            throw new Error(`Failed to create sickness record: ${sicknessError.message}`);
          }

          console.log(`Successfully created sickness record with ID: ${insertedRecord.id}`);
          processed++;
          
        } catch (recordError) {
          const errorMessage = recordError instanceof Error ? recordError.message : 'Unknown error';
          console.error(`Failed to import record for ${record.employeeName}:`, errorMessage);
          failedRecords.push({ record, error: errorMessage });
          failed++;
        }

        setImportProgress(((processed + failed) / total) * 100);
      }

      console.log(`Import completed. Processed: ${processed}, Failed: ${failed}`);

      if (failed > 0) {
        console.log('Failed records:', failedRecords);
      }

      // Store import results for display
      setImportResult({ processed, failed, failedRecords });
      setCurrentStep('complete');
      
      if (processed > 0) {
        toast({
          title: "Import completed",
          description: failed > 0 
            ? `Created ${processed} sickness records. ${failed} records failed to import.`
            : `Successfully created ${processed} sickness records and updated employee schemes`
        });
      } else {
        toast({
          title: "Import failed",
          description: `No records were imported. ${failed} records failed validation.`,
          variant: "destructive"
        });
      }

      // Call completion callback for embedded mode
      if (mode === 'embedded' && onComplete) {
        onComplete(processed);
      }

    } catch (error) {
      console.error('Error during import process:', error);
      toast({
        title: "Error during import",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setSicknessRecords([]);
    setCurrentStep('upload');
    setImportProgress(0);
    setSkipAllUnmatched(false);
    setSchemeSkipAllUnmatched(false);
    setSearchTerm('');
    setFilterStatus('all');
    setImportResult(null);
  };

  // Helper function to parse database error messages into user-friendly text
  const parseErrorMessage = (error: string): string => {
    if (error.includes('valid_date_range')) {
      return 'Start date must be on or before end date';
    }
    if (error.includes('duplicate key value')) {
      return 'A sickness record already exists for this employee and date range';
    }
    if (error.includes('foreign key constraint')) {
      return 'Invalid employee or company reference';
    }
    if (error.includes('Invalid start date') || error.includes('Invalid end date')) {
      return error; // Already user-friendly
    }
    return error;
  };

  // Filter records for display
  const filteredRecords = sicknessRecords.filter(record => {
    const matchesSearch = !searchTerm || 
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.reason && record.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' || record.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Statistics
  const stats = {
    total: sicknessRecords.length,
    ready: sicknessRecords.filter(r => r.status === 'ready').length,
    needsAttention: sicknessRecords.filter(r => r.status === 'needs_attention').length,
    skipped: sicknessRecords.filter(r => r.status === 'skipped').length,
    withOverlaps: sicknessRecords.filter(r => r.hasOverlap).length
  };

  return (
    <div className="space-y-6">
      {/* Upload Step */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Sickness Records
            </CardTitle>
            <CardDescription>
              Upload an Excel or CSV file containing employee sickness records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-4">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) handleFileSelect(selectedFile);
                  }}
                  ref={fileInputRef}
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="mb-2"
                >
                  Select File
                </Button>
                <p className="text-sm text-muted-foreground">
                  Accepts .xlsx, .xls, or .csv files
                </p>
              </div>
            </div>

            {file && (
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <Badge variant="secondary">{Math.round(file.size / 1024)}KB</Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Required columns:</strong> Employee Name<br />
                <strong>Optional columns:</strong> Sickness Days, Start Date, End Date, Scheme Allocation, Reason, Certified, Notes<br />
                <em>Note:</em> Working days will be calculated automatically from start/end dates and employee work patterns when available. Sickness days column is optional.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                onClick={processFile} 
                disabled={!file || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Process File
                  </>
                )}
              </Button>
              {mode === 'embedded' && onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <Progress value={importProgress} />
                <p className="text-sm text-muted-foreground text-center">
                  Processing... {Math.round(importProgress)}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review Step */}
      {currentStep === 'review' && (
        <div className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Records</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <div>
                    <p className="text-2xl font-bold text-success">{stats.ready}</p>
                    <p className="text-xs text-muted-foreground">Ready to Import</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <div>
                    <p className="text-2xl font-bold text-warning">{stats.needsAttention}</p>
                    <p className="text-xs text-muted-foreground">Needs Attention</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <UserX className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold text-muted-foreground">{stats.skipped}</p>
                    <p className="text-xs text-muted-foreground">Skipped</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-2xl font-bold text-amber-500">{stats.withOverlaps}</p>
                    <p className="text-xs text-muted-foreground">With Overlaps</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Records</SelectItem>
                <SelectItem value="ready">Ready to Import</SelectItem>
                <SelectItem value="needs_attention">Needs Attention</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skip-unmatched"
                  checked={skipAllUnmatched}
                  onCheckedChange={handleToggleSkipAllUnmatched}
                />
                <label htmlFor="skip-unmatched" className="text-sm">
                  Skip all unmatched employees
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skip-schemes"
                  checked={schemeSkipAllUnmatched}
                  onCheckedChange={handleSchemeToggleSkipAllUnmatched}
                />
                <label htmlFor="skip-schemes" className="text-sm">
                  Skip all unmatched schemes
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-overlaps"
                  checked={sicknessRecords.filter(r => r.hasOverlap && r.status !== 'skipped').length > 0}
                  onCheckedChange={(checked) => {
                    setSicknessRecords(records =>
                      records.map(record => {
                        if (record.hasOverlap) {
                          return {
                            ...record,
                            status: checked ? 'needs_attention' : 'skipped'
                          };
                        }
                        return record;
                      })
                    );
                  }}
                />
                <label htmlFor="include-overlaps" className="text-sm">
                  Include records with overlaps (review before import)
                </label>
              </div>
            </div>
          </div>

          {/* Records Table */}
          <Card>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Matched Employee</TableHead>
                    <TableHead>Scheme</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow 
                      key={record.id}
                      className={record.hasOverlap ? 'bg-amber-50 dark:bg-amber-950/20' : ''}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{record.employeeName}</p>
                          {record.reason && (
                            <p className="text-xs text-muted-foreground">{record.reason}</p>
                          )}
                          {record.hasOverlap && (
                            <div className="flex items-center gap-1 mt-1">
                              <AlertCircle className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                Auto-skipped: {record.overlapDetails?.message}
                              </p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {record.sicknessDays} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={record.matchedEmployeeId || "none"}
                          onValueChange={(value) => 
                            handleManualEmployeeMapping(record.id, value === "none" ? null : value)
                          }
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No match</SelectItem>
                            {employees.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.last_name}, {emp.first_name}
                                {emp.payroll_id && ` (${emp.payroll_id})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {record.confidence && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Confidence: {record.confidence}%
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={record.matchedSchemeName || "none"}
                          onValueChange={(value) => 
                            handleManualSchemeMapping(record.id, value === "none" ? null : value)
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Select scheme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No scheme</SelectItem>
                            {schemes.map((scheme) => (
                              <SelectItem key={scheme.id} value={scheme.name}>
                                {scheme.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge
                            variant={
                              record.status === 'ready' ? 'default' :
                              record.status === 'needs_attention' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {record.status === 'ready' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {record.status === 'needs_attention' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {record.status === 'skipped' && <UserX className="h-3 w-3 mr-1" />}
                            {record.status.replace('_', ' ')}
                          </Badge>
                          {record.hasOverlap && (
                            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Has Overlap
                            </Badge>
                          )}
                        </div>
                        {record.statusReason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {record.statusReason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSicknessRecords(records =>
                              records.map(r => 
                                r.id === record.id 
                                  ? { ...r, status: r.status === 'skipped' ? 'needs_attention' : 'skipped' }
                                  : r
                              )
                            );
                          }}
                        >
                          {record.status === 'skipped' ? 'Include' : 'Skip'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-between">
            <Button variant="outline" onClick={handleReset}>
              Start Over
            </Button>
            <div className="flex gap-2">
              {mode === 'embedded' && onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleProceedFromReview}
                disabled={stats.ready === 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue to Overlap Detection
                  </>
                )}
              </Button>
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={importProgress} />
              <p className="text-sm text-muted-foreground text-center">
                Importing records... {Math.round(importProgress)}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Overlap-Trim Step */}
      {currentStep === 'overlap-trim' && (
        <OverlapTrimView 
          records={sicknessRecords}
          onProceed={handleProceedFromOverlapTrim}
          onBack={() => setCurrentStep('review')}
        />
      )}

      {/* Final Review Step */}
      {currentStep === 'final-review' && (
        <FinalReviewView 
          records={sicknessRecords}
          onImport={handleImport}
          onBack={() => setCurrentStep('overlap-trim')}
          isImporting={isImporting}
        />
      )}

      {/* Complete Step */}
      {currentStep === 'complete' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <CheckCircle className="h-16 w-16 mx-auto text-success" />
              <div>
                <h3 className="text-lg font-semibold">Import Completed</h3>
                {importResult && (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">
                      {importResult.processed > 0 && (
                        <span className="text-success font-medium">
                          {importResult.processed} records imported successfully
                        </span>
                      )}
                      {importResult.processed > 0 && importResult.failed > 0 && <br />}
                      {importResult.failed > 0 && (
                        <span className="text-destructive font-medium">
                          {importResult.failed} records failed to import
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleReset}>
                  Import More Records
                </Button>
                {mode === 'embedded' && onComplete && (
                  <Button variant="outline" onClick={() => onComplete(importResult?.processed || 0)}>
                    Continue
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Failed Records Section */}
          {importResult && importResult.failed > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Failed Import Records ({importResult.failed})
                </CardTitle>
                <CardDescription>
                  The following records could not be imported. Please review and fix the issues before retrying.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {importResult.failedRecords.map((failedItem, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-destructive/5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="destructive" className="text-xs">Failed</Badge>
                            <span className="font-medium">{failedItem.record.employeeName}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-2">
                            <div>
                              <span className="font-medium">Days:</span> {failedItem.record.sicknessDays}
                            </div>
                            <div>
                              <span className="font-medium">Dates:</span> {failedItem.record.startDate || 'No start date'} 
                              {failedItem.record.endDate && ` - ${failedItem.record.endDate}`}
                            </div>
                            {failedItem.record.reason && (
                              <div className="col-span-2">
                                <span className="font-medium">Reason:</span> {failedItem.record.reason}
                              </div>
                            )}
                          </div>
                          <div className="p-2 bg-destructive/10 rounded text-sm">
                            <span className="font-medium text-destructive">Error:</span> {parseErrorMessage(failedItem.error)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Common fixes:</strong>
                    <ul className="mt-1 space-y-1 text-sm">
                      <li>• Check that start dates are on or before end dates</li>
                      <li>• Verify date formats are valid (DD/MM/YYYY)</li>
                      <li>• Ensure no duplicate records exist for the same employee and dates</li>
                      <li>• Confirm employee names match exactly</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};