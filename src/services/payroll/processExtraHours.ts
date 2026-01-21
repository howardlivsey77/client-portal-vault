
import { parseExtraHoursFile } from '@/utils/payroll/fileParsing';
import { ExtraHoursSummary } from '@/components/payroll/types';
import { enrichEmployeeData } from './employeeEnrichment';
import { supabase } from '@/integrations/supabase/client';
import { ImportFormat } from '@/components/payroll/FormatSelector';
import { TeamnetRateConfig, RateCondition, HolidayConfig } from '@/utils/payroll/fileParsing/teamnetRateCalculator';
import { CompanyHoliday, CompanyHolidaySettings } from '@/features/company-settings/types/companyHoliday';

/**
 * Process an extra hours file and return summary data
 * @param file - The file to process
 * @param format - Optional format override (practice-index or teamnet)
 * @param companyId - Optional company ID to load company-specific rate configuration
 */
export const processExtraHoursFile = async (
  file: File, 
  format?: ImportFormat,
  companyId?: string
): Promise<ExtraHoursSummary> => {
  try {
    console.log('Processing extra hours file:', file.name, 'Format:', format || 'auto-detect', 'Company:', companyId || 'none');
    
    // Fetch company-specific rate configuration if companyId provided
    let rateConfig: TeamnetRateConfig | null = null;
    if (companyId) {
      const { data, error } = await supabase
        .from('teamnet_rate_configs')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) {
        console.warn('Error fetching rate config:', error);
      } else if (data) {
        rateConfig = {
          id: data.id,
          name: data.name,
          default_rate: data.default_rate,
          conditions: (data.conditions as unknown) as RateCondition[],
          is_active: data.is_active
        };
        console.log('Using company rate config:', rateConfig.name, 'with', rateConfig.conditions.length, 'conditions');
      }
    }
    
    // Fetch company holiday settings
    let holidaySettings: CompanyHolidaySettings | null = null;
    if (companyId) {
      const { data: settingsData, error: settingsError } = await supabase
        .from('company_holiday_settings')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      
      if (settingsError) {
        console.warn('Error fetching holiday settings:', settingsError);
      } else if (settingsData) {
        holidaySettings = {
          use_uk_bank_holidays: settingsData.use_uk_bank_holidays,
          bank_holiday_rate: settingsData.bank_holiday_rate as 2 | 3 | 4
        };
        console.log('Using holiday settings:', holidaySettings);
      }
    }
    
    // Fetch custom company holidays
    let customHolidays: CompanyHoliday[] = [];
    if (companyId) {
      const { data: holidaysData, error: holidaysError } = await supabase
        .from('company_holidays')
        .select('*')
        .eq('company_id', companyId);
      
      if (holidaysError) {
        console.warn('Error fetching company holidays:', holidaysError);
      } else if (holidaysData) {
        customHolidays = holidaysData.map(h => ({
          id: h.id,
          company_id: h.company_id,
          date: h.date,
          name: h.name,
          rate_override: h.rate_override as 2 | 3 | 4,
          all_day: h.all_day,
          time_from: h.time_from,
          time_to: h.time_to,
          is_recurring: h.is_recurring ?? false,
          created_at: h.created_at,
          updated_at: h.updated_at
        }));
        console.log('Loaded', customHolidays.length, 'custom company holidays');
      }
    }
    
    // Create holidayConfig object
    const holidayConfig: HolidayConfig = {
      holidays: customHolidays,
      settings: holidaySettings
    };
    
    // Parse the file with the specified format, rate config, and holiday config
    const parsedData = await parseExtraHoursFile(file, { format, rateConfig, holidayConfig });
    
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
 * @param data - The processed payroll data
 * @param userId - The user ID
 * @param companyId - Optional company ID
 * @param targetPeriod - Optional target period (if not provided, will be derived from file dates)
 */
export const savePayrollData = async (
  data: ExtraHoursSummary, 
  userId: string,
  companyId?: string,
  targetPeriod?: { periodNumber: number; year: number }
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
    
  // Use target period if provided, otherwise derive from file dates (UK financial period)
  let periodNumber: number;
  let financialYear: number;
  
  if (targetPeriod) {
    // Use the user-selected period from UI
    periodNumber = targetPeriod.periodNumber;
    financialYear = targetPeriod.year;
    console.log('Using target period from UI:', { periodNumber, financialYear });
  } else {
    // Fallback: derive from file dates using UK financial period calculation
    const calendarMonth = fromDate.getMonth() + 1; // 1-12 (Jan-Dec)
    
    if (calendarMonth >= 4) {
      // April-December: period = month - 3, year = calendar year
      periodNumber = calendarMonth - 3; // April(4)->1, Dec(12)->9
      financialYear = fromDate.getFullYear();
    } else {
      // January-March: period = month + 9, year = calendar year - 1
      periodNumber = calendarMonth + 9; // Jan(1)->10, Mar(3)->12
      financialYear = fromDate.getFullYear() - 1;
    }
    console.log('Derived period from file dates:', { calendarMonth, periodNumber, financialYear });
  }

  // Check if period already exists for this user/period/year
  const { data: existingPeriod } = await supabase
    .from('payroll_periods')
    .select('id')
    .eq('user_id', userId)
    .eq('period_number', periodNumber)
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
        period_number: periodNumber,
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
