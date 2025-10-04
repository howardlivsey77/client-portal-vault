import { ProcessedSicknessRecord } from "@/components/sickness-import/types";
import { WorkDay } from "@/components/employees/details/work-pattern/types";
import { countWorkingDaysBetween } from "@/components/employees/details/sickness/utils/workingDaysCalculations";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface OverlappingRecord {
  id: string;
  start_date: string;
  end_date?: string;
  total_days: number;
}

interface TrimmedRecord extends DateRange {
  sicknessDays: number;
}

/**
 * Auto-trim an imported record by removing overlapping date ranges
 * Returns array of trimmed records (may be split into multiple if overlaps create gaps)
 */
export function autoTrimRecord(
  importedRecord: ProcessedSicknessRecord,
  overlappingRecords: OverlappingRecord[],
  workPattern: WorkDay[]
): ProcessedSicknessRecord[] {
  if (!importedRecord.startDate || !importedRecord.endDate) {
    return [importedRecord];
  }

  if (overlappingRecords.length === 0) {
    return [importedRecord];
  }

  // Sort overlapping records by start date
  const sortedOverlaps = [...overlappingRecords].sort((a, b) => 
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  // Build array of blocked date ranges
  const blockedRanges: DateRange[] = sortedOverlaps.map(overlap => ({
    startDate: overlap.start_date,
    endDate: overlap.end_date || overlap.start_date
  }));

  // Find available (non-blocked) date ranges
  const availableRanges = findAvailableDateRanges(
    importedRecord.startDate,
    importedRecord.endDate,
    blockedRanges
  );

  // If no available ranges, record is fully overlapping
  if (availableRanges.length === 0) {
    return [{
      ...importedRecord,
      status: 'skipped' as const,
      statusReason: 'Fully overlapping with existing records',
      trimStatus: 'fully_overlapping',
      wasTrimmed: true,
      trimmedFrom: {
        originalStartDate: importedRecord.startDate,
        originalEndDate: importedRecord.endDate,
        originalSicknessDays: importedRecord.sicknessDays || 0
      }
    }];
  }

  // Generate trimmed records for each available range
  const trimmedRecords: ProcessedSicknessRecord[] = availableRanges.map((range, index) => {
    const workingDays = countWorkingDaysBetween(range.startDate, range.endDate, workPattern);
    
    return {
      ...importedRecord,
      id: availableRanges.length > 1 ? `${importedRecord.id}-split-${index + 1}` : importedRecord.id,
      startDate: range.startDate,
      endDate: range.endDate,
      sicknessDays: workingDays,
      wasTrimmed: true,
      trimmedFrom: {
        originalStartDate: importedRecord.startDate,
        originalEndDate: importedRecord.endDate,
        originalSicknessDays: importedRecord.sicknessDays || 0
      },
      splitInto: availableRanges.length,
      parentRecordId: availableRanges.length > 1 ? importedRecord.id : undefined,
      trimStatus: availableRanges.length > 1 ? 'split' : 'trimmed',
      status: 'ready' as const,
      hasOverlap: false,
      overlapDetails: undefined
    };
  });

  return trimmedRecords;
}

/**
 * Find date ranges that don't overlap with blocked ranges
 */
function findAvailableDateRanges(
  startDate: string,
  endDate: string,
  blockedRanges: DateRange[]
): DateRange[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const availableRanges: DateRange[] = [];
  let currentStart = start;

  for (const blocked of blockedRanges) {
    const blockStart = new Date(blocked.startDate);
    const blockEnd = new Date(blocked.endDate);

    // If there's a gap before this blocked range
    if (currentStart < blockStart) {
      const gapEnd = new Date(blockStart);
      gapEnd.setDate(gapEnd.getDate() - 1);
      
      if (currentStart <= gapEnd) {
        availableRanges.push({
          startDate: formatDate(currentStart),
          endDate: formatDate(gapEnd)
        });
      }
    }

    // Move current start to after the blocked range
    const nextStart = new Date(blockEnd);
    nextStart.setDate(nextStart.getDate() + 1);
    currentStart = nextStart > currentStart ? nextStart : currentStart;
  }

  // Add final range if there's space after all blocked ranges
  if (currentStart <= end) {
    availableRanges.push({
      startDate: formatDate(currentStart),
      endDate: formatDate(end)
    });
  }

  return availableRanges;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Process all records and auto-trim overlaps
 */
export async function processRecordsWithAutoTrim(
  records: ProcessedSicknessRecord[],
  checkOverlapFn: (employeeId: string, startDate: string, endDate?: string) => Promise<{
    hasOverlap: boolean;
    overlappingRecords: OverlappingRecord[];
  }>,
  getWorkPatternFn: (employeeId: string) => Promise<WorkDay[]>
): Promise<ProcessedSicknessRecord[]> {
  const processedRecords: ProcessedSicknessRecord[] = [];

  for (const record of records) {
    // Skip records without matched employee or already skipped
    if (!record.matchedEmployeeId || record.status === 'skipped') {
      processedRecords.push(record);
      continue;
    }

    // Check for overlaps
    const overlapResult = await checkOverlapFn(
      record.matchedEmployeeId,
      record.startDate || '',
      record.endDate
    );

    if (!overlapResult.hasOverlap) {
      // No overlap - mark as ready
      processedRecords.push({
        ...record,
        trimStatus: 'no_overlap',
        hasOverlap: false
      });
      continue;
    }

    // Get work pattern for the employee
    const workPattern = await getWorkPatternFn(record.matchedEmployeeId);

    // Auto-trim the record
    const trimmedRecords = autoTrimRecord(
      record,
      overlapResult.overlappingRecords,
      workPattern
    );

    processedRecords.push(...trimmedRecords);
  }

  return processedRecords;
}
