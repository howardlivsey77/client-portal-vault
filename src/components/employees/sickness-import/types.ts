// Shared types for sickness import functionality

export interface SicknessRecord {
  employeeName: string;
  sicknessDays?: number; // Made optional - can be calculated from dates and work patterns
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
  hasOverlap?: boolean;
  overlapDetails?: {
    overlappingRecords: Array<{
      id: string;
      start_date: string;
      end_date?: string;
      total_days: number;
    }>;
    message?: string;
  };
  // Auto-trim fields
  wasTrimmed?: boolean;
  trimmedFrom?: {
    originalStartDate: string;
    originalEndDate: string;
    originalSicknessDays: number;
  };
  splitInto?: number; // Number of records this was split into
  parentRecordId?: string; // If this is a child of a split record
  trimStatus?: 'no_overlap' | 'trimmed' | 'split' | 'fully_overlapping';
}

export type ImportStep = 
  | 'upload' 
  | 'review'           // Employee/scheme matching
  | 'overlap-trim'     // Overlap detection & auto-trim
  | 'final-review'     // Final confirmation before import
  | 'complete';

export interface SicknessImportCoreProps {
  mode?: 'standalone' | 'embedded';
  onComplete?: (importedCount: number) => void;
  onCancel?: () => void;
}