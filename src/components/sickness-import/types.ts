// Shared types for sickness import functionality

export interface SicknessRecord {
  employeeName: string;
  sicknessDays: number;
  startDate?: string;
  endDate?: string;
  reason?: string;
  schemeAllocation?: string;
  isCertified?: boolean;
  notes?: string;
}

export interface ProcessedSicknessRecord extends SicknessRecord {
  id: string;
  matchedEmployeeId: string | null;
  matchedSchemeName: string | null;
  status: 'ready' | 'needs_attention' | 'skipped';
  statusReason?: string;
  confidence?: number;
  suggestions?: Array<{
    id: string;
    name: string;
    confidence: number;
    payrollId?: string;
  }>;
}

export interface SicknessImportCoreProps {
  mode?: 'standalone' | 'embedded';
  onComplete?: (importedCount: number) => void;
  onCancel?: () => void;
}