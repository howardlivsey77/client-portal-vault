import { supabase } from "@/integrations/supabase/client";
import { SicknessRecord } from "@/types/sickness";

export interface OverlapResult {
  hasOverlap: boolean;
  overlappingRecords: Array<{
    id: string;
    start_date: string;
    end_date?: string;
    total_days: number;
  }>;
  message?: string;
}

export const overlapService = {
  // Check for overlapping sickness records for an employee
  async checkForOverlappingSickness(
    employeeId: string,
    startDate: string,
    endDate?: string,
    excludeRecordId?: string
  ): Promise<OverlapResult> {
    try {
      const { data: existingRecords, error } = await supabase
        .from('employee_sickness_records')
        .select('id, start_date, end_date, total_days')
        .eq('employee_id', employeeId);

      if (error) throw error;

      // Use string comparison to avoid timezone issues
      // YYYY-MM-DD format sorts correctly lexicographically
      const recordStartStr = startDate;
      const recordEndStr = endDate || startDate;

      const overlappingRecords = existingRecords
        ?.filter(record => {
          // Skip the record being edited
          if (excludeRecordId && record.id === excludeRecordId) {
            return false;
          }

          const existingStartStr = record.start_date;
          const existingEndStr = record.end_date || record.start_date;

          // Check for any overlap using string comparison
          return recordStartStr <= existingEndStr && recordEndStr >= existingStartStr;
        }) || [];

      if (overlappingRecords.length > 0) {
        const overlapDetails = overlappingRecords.map(record => {
          return `${record.start_date} to ${record.end_date || record.start_date}`;
        }).join('; ');

        return {
          hasOverlap: true,
          overlappingRecords,
          message: `Overlaps with existing record(s): ${overlapDetails}`
        };
      }

      return {
        hasOverlap: false,
        overlappingRecords: []
      };
    } catch (error) {
      console.error('Error checking for overlapping sickness:', error);
      return {
        hasOverlap: false,
        overlappingRecords: [],
        message: 'Unable to check for overlapping records'
      };
    }
  },

  // Find and return all duplicate/overlapping records for cleanup
  async findDuplicatesForEmployee(employeeId: string): Promise<SicknessRecord[]> {
    try {
      const { data: records, error } = await supabase
        .from('employee_sickness_records')
        .select('*')
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: true });

      if (error) throw error;

      const duplicates: SicknessRecord[] = [];
      
      for (let i = 0; i < records.length; i++) {
        for (let j = i + 1; j < records.length; j++) {
          const record1 = records[i];
          const record2 = records[j];

          const start1 = new Date(record1.start_date);
          const end1 = record1.end_date ? new Date(record1.end_date) : start1;
          const start2 = new Date(record2.start_date);
          const end2 = record2.end_date ? new Date(record2.end_date) : start2;

          // Check for overlap
          if (start1 <= end2 && start2 <= end1) {
            if (!duplicates.find(d => d.id === record1.id)) {
              duplicates.push(record1);
            }
            if (!duplicates.find(d => d.id === record2.id)) {
              duplicates.push(record2);
            }
          }
        }
      }

      return duplicates;
    } catch (error) {
      console.error('Error finding duplicates:', error);
      return [];
    }
  }
};