
import { EmployeeMatchingResults, EmployeeMatchResult } from '@/services/payroll/employeeMatching';

export interface EmployeeMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchingResults: EmployeeMatchingResults;
  onConfirm: (mappings: Record<string, string>, rememberMappings: Record<string, boolean>) => void;
  onCancel: () => void;
  companyId?: string;
}

export interface EmployeeCardProps {
  match: EmployeeMatchResult;
  userMappings: Record<string, string>;
  allDatabaseEmployees: any[];
  expandedCards: Record<string, boolean>;
  rememberMappings: Record<string, boolean>;
  onMappingChange: (employeeName: string, employeeId: string) => void;
  onToggleExpansion: (employeeName: string) => void;
  onRememberChange: (employeeName: string, remember: boolean) => void;
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
