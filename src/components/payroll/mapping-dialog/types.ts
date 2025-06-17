
import { EmployeeMatchingResults, EmployeeMatchResult } from '@/services/payroll/employeeMatching';

export interface EmployeeMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchingResults: EmployeeMatchingResults;
  onConfirm: (mappings: Record<string, string>) => void;
  onCancel: () => void;
}

export interface EmployeeCardProps {
  match: EmployeeMatchResult;
  userMappings: Record<string, string>;
  allDatabaseEmployees: any[];
  expandedCards: Record<string, boolean>;
  onMappingChange: (employeeName: string, employeeId: string) => void;
  onToggleExpansion: (employeeName: string) => void;
}

export interface ProgressDisplayProps {
  totalEmployees: number;
  totalMapped: number;
}

export interface SummaryCardsProps {
  exactMatches: number;
  fuzzyMatches: number;
  unmatchedEmployees: number;
}
