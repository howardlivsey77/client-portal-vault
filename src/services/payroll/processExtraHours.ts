
import { parseExtraHoursFile } from '@/utils/payroll/fileParsing';
import { ExtraHoursSummary } from '@/components/payroll/types';
import { enrichEmployeeData } from './employeeEnrichment';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { ImportFormat } from '@/components/payroll/FormatSelector';

/**
 * Process an extra hours file and return summary data
 * @param file - The file to process
 * @param format - Optional format override (practice-index or teamnet)
 */
export const processExtraHoursFile = async (file: File, format?: ImportFormat): Promise<ExtraHoursSummary> => {
  try {
    console.log('Processing extra hours file:', file.name, 'Format:', format || 'auto-detect');
    
    // Parse the file with the specified format
    const parsedData = await parseExtraHoursFile(file, format);
    
    // Enrich with employee data from the database
    await enrichEmployeeData(parsedData);
    
    return parsedData;
  } catch (error) {
    console.error('Error processing extra hours file:', error);
    throw error;
  }
};

/**
 * Save processed payroll data to the database
 * This stores both summary and detailed employee records
 */
export const savePayrollData = async (
  data: ExtraHoursSummary, 
  userId: string,
  companyId?: string
): Promise<{success: boolean, message: string, periodId?: string}> => {
  try {
    if (!data || !userId) {
      return { success: false, message: "Missing data or user ID" };
    }
    
    // Parse date strings to extract month/year info - use ISO format if available
    const fromDateStr = data.dateRange.fromISO || data.dateRange.from;
    const toDateStr = data.dateRange.toISO || data.dateRange.to;
    
    const fromDate = new Date(fromDateStr);
    const toDate = new Date(toDateStr);
    
    // Validate dates
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      console.error('Invalid dates:', { fromDateStr, toDateStr });
      return { success: false, message: "Invalid date format in data" };
    }
    
  // Calculate period number (assuming month-based periods)
  const periodMonth = fromDate.getMonth() + 1; // 1-12
  const financialYear = fromDate.getFullYear();

  // Check if period already exists for this user/period/year
  const { data: existingPeriod } = await supabase
    .from('payroll_periods')
    .select('id')
    .eq('user_id', userId)
    .eq('period_number', periodMonth)
    .eq('financial_year', financialYear)
    .maybeSingle();

  let periodId: string;

  if (existingPeriod) {
    // Period already exists - use it and update the totals
    periodId = existingPeriod.id;
    
    // Update the existing period with new totals
    const { error: updateError } = await supabase
      .from('payroll_periods')
      .update({
        company_id: companyId || null,
        date_from: fromDate.toISOString().split('T')[0],
        date_to: toDate.toISOString().split('T')[0],
        total_entries: data.totalEntries,
        total_extra_hours: data.totalExtraHours,
        employee_count: data.employeeCount,
      })
      .eq('id', periodId);
      
    if (updateError) {
      console.error('Error updating payroll period:', updateError);
      return { success: false, message: `Error updating payroll data: ${updateError.message}` };
    }
    
    // Delete existing employee details for this period to avoid duplicates
    await supabase
      .from('payroll_employee_details')
      .delete()
      .eq('payroll_period_id', periodId);
      
  } else {
    // No existing period - insert new one
    const { data: periodData, error: periodError } = await supabase
      .from('payroll_periods')
      .insert({
        user_id: userId,
        company_id: companyId || null,
        period_number: periodMonth,
        financial_year: financialYear,
        date_from: fromDate.toISOString().split('T')[0],
        date_to: toDate.toISOString().split('T')[0],
        total_entries: data.totalEntries,
        total_extra_hours: data.totalExtraHours,
        employee_count: data.employeeCount,
      })
      .select()
      .single();

    if (periodError) {
      console.error('Error saving payroll period:', periodError);
      return { success: false, message: `Error saving payroll data: ${periodError.message}` };
    }
    
    periodId = periodData.id;
  }
    
    // Then insert all employee details
    const employeeDetailsInserts = data.employeeDetails.map(emp => ({
      payroll_period_id: periodId,
      employee_id: emp.employeeId || null,
      employee_name: emp.employeeName || null,
      payroll_id: emp.payrollId || null,
      rate_type: emp.rateType || null,
      rate_value: emp.rateValue || null,
      extra_hours: emp.extraHours,
      entries: emp.entries
    }));
    
    const { error: detailsError } = await supabase
      .from('payroll_employee_details')
      .insert(employeeDetailsInserts);
    
    if (detailsError) {
      console.error('Error saving employee details:', detailsError);
      return { success: false, message: `Error saving employee details: ${detailsError.message}` };
    }
    
    return { 
      success: true, 
      message: "Payroll data saved successfully", 
      periodId 
    };
  } catch (error) {
    console.error('Error in savePayrollData:', error);
    return { 
      success: false, 
      message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

/**
 * Fetch all payroll periods for the current user
 */
export const fetchPayrollPeriods = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('payroll_periods')
      .select('*')
      .eq('user_id', userId)
      .order('financial_year', { ascending: false })
      .order('period_number', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching payroll periods:', error);
    throw error;
  }
};

/**
 * Fetch employee details for a specific payroll period
 */
export const fetchPayrollEmployeeDetails = async (periodId: string) => {
  try {
    const { data, error } = await supabase
      .from('payroll_employee_details')
      .select('*')
      .eq('payroll_period_id', periodId);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching payroll employee details:', error);
    throw error;
  }
};
