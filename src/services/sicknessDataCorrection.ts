import { supabase } from "@/integrations/supabase/client";
import { calculateWorkingDaysForRecord } from "@/components/employees/details/sickness/utils/workingDaysCalculations";

/**
 * Service to correct sickness data inconsistencies
 */
export const sicknessDataCorrection = {
  /**
   * Fix Karen Cross's incorrect dates and working days
   */
  async fixKarenCrossRecord() {
    console.log('Fixing Karen Cross\'s sickness record...');
    
    // Update Karen's record from 21-25 Sep to 22-26 Sep and recalculate working days
    const { data: karenRecord, error: fetchError } = await supabase
      .from('employee_sickness_records')
      .select('*')
      .eq('employee_id', '1284d48b-eec1-41e7-8f47-91ceb435c6a6')
      .eq('start_date', '2025-09-21')
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching Karen\'s record:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!karenRecord) {
      console.log('Karen\'s record not found');
      return { success: false, error: 'Record not found' };
    }

    // Get Karen's work pattern
    const { data: workPatterns, error: workPatternError } = await supabase
      .from('work_patterns')
      .select('day, is_working, start_time, end_time')
      .eq('employee_id', '1284d48b-eec1-41e7-8f47-91ceb435c6a6');

    if (workPatternError || !workPatterns) {
      console.error('Error fetching work pattern:', workPatternError);
      return { success: false, error: 'Could not fetch work pattern' };
    }

    const workPattern = workPatterns.map(wp => ({
      day: wp.day,
      isWorking: wp.is_working,
      startTime: wp.start_time || '',
      endTime: wp.end_time || '',
      payrollId: ''
    }));

    // Calculate correct working days for Sep 22-26, 2025 (Mon-Fri = 3 days)
    const correctWorkingDays = calculateWorkingDaysForRecord(
      '2025-09-22',
      '2025-09-26',
      workPattern
    );

    console.log(`Calculated working days for Karen (22-26 Sep): ${correctWorkingDays}`);

    // Update the record
    const { error: updateError } = await supabase
      .from('employee_sickness_records')
      .update({
        start_date: '2025-09-22',
        end_date: '2025-09-26',
        total_days: correctWorkingDays
      })
      .eq('id', karenRecord.id);

    if (updateError) {
      console.error('Error updating Karen\'s record:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('Successfully fixed Karen\'s record');
    return { success: true, workingDays: correctWorkingDays };
  },

  /**
   * Fix Klaudia Adamiec's working days calculation
   */
  async fixKlaudiaAdamiecRecord() {
    console.log('Fixing Klaudia Adamiec\'s sickness record...');
    
    // Get Klaudia's record
    const { data: klaudiaRecord, error: fetchError } = await supabase
      .from('employee_sickness_records')
      .select('*')
      .eq('employee_id', 'adb63e3c-f891-45ca-9bfb-5f28b97a9a93')
      .eq('start_date', '2025-09-22')
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching Klaudia\'s record:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!klaudiaRecord) {
      console.log('Klaudia\'s record not found');
      return { success: false, error: 'Record not found' };
    }

    // Get Klaudia's work pattern
    const { data: workPatterns, error: workPatternError } = await supabase
      .from('work_patterns')
      .select('day, is_working, start_time, end_time')
      .eq('employee_id', 'adb63e3c-f891-45ca-9bfb-5f28b97a9a93');

    if (workPatternError || !workPatterns) {
      console.error('Error fetching work pattern:', workPatternError);
      return { success: false, error: 'Could not fetch work pattern' };
    }

    const workPattern = workPatterns.map(wp => ({
      day: wp.day,
      isWorking: wp.is_working,
      startTime: wp.start_time || '',
      endTime: wp.end_time || '',
      payrollId: ''
    }));

    // Calculate correct working days for Sep 22-23, 2025 (Mon-Tue = 2 days)
    const correctWorkingDays = calculateWorkingDaysForRecord(
      klaudiaRecord.start_date,
      klaudiaRecord.end_date || klaudiaRecord.start_date,
      workPattern
    );

    console.log(`Calculated working days for Klaudia (22-23 Sep): ${correctWorkingDays}`);

    // Update if different
    if (correctWorkingDays !== Number(klaudiaRecord.total_days)) {
      const { error: updateError } = await supabase
        .from('employee_sickness_records')
        .update({
          total_days: correctWorkingDays
        })
        .eq('id', klaudiaRecord.id);

      if (updateError) {
        console.error('Error updating Klaudia\'s record:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log('Successfully fixed Klaudia\'s record');
      return { success: true, workingDays: correctWorkingDays, changed: true };
    } else {
      console.log('Klaudia\'s record is already correct');
      return { success: true, workingDays: correctWorkingDays, changed: false };
    }
  },

  /**
   * Fix both problematic records
   */
  async fixAllRecords() {
    console.log('Starting comprehensive sickness data correction...');
    
    const results = {
      karen: await this.fixKarenCrossRecord(),
      klaudia: await this.fixKlaudiaAdamiecRecord()
    };

    console.log('Correction results:', results);
    return results;
  }
};