
import * as XLSX from 'xlsx';
import { ExtraHoursSummary } from '@/components/payroll/types';
import { extractDateRange } from './dateExtractor';
import { extractEmployeeData } from './extractEmployeeData';
import { formatSummary } from './formatSummary';
import { isTeamnetFormat, parseTeamnetData } from './teamnetParser';
import { TeamnetRateConfig } from './teamnetRateCalculator';
import { ImportFormat } from '@/components/payroll/FormatSelector';

export interface ParseExtraHoursOptions {
  format?: ImportFormat;
  rateConfig?: TeamnetRateConfig | null;
}

/**
 * Parse an Excel or CSV file containing extra hours data
 * @param file - The file to parse
 * @param options - Optional parsing options including format override and rate config
 */
export const parseExtraHoursFile = async (
  file: File, 
  options?: ParseExtraHoursOptions | ImportFormat
): Promise<ExtraHoursSummary> => {
  // Handle backwards compatibility - if options is a string, it's the old format parameter
  const format = typeof options === 'string' ? options : options?.format;
  const rateConfig = typeof options === 'object' ? options?.rateConfig : undefined;
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { 
          type: 'array',
          raw: true  // Preserve raw values, don't auto-convert dates
        });
        
        // Assume first sheet contains the data
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON - use raw: true to preserve string dates for UK format parsing
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          raw: true  // Return raw strings instead of auto-detected types
        });
        
        console.log('Parsed file data:', jsonData);
        
        // Determine format - use provided format or auto-detect
        const useTeamnet = format === 'teamnet' || (!format && isTeamnetFormat(jsonData));
        
        if (useTeamnet) {
          console.log('Using Teamnet parser with time-based rate calculation');
          const summary = parseTeamnetData(jsonData, rateConfig);
          resolve(summary);
        } else {
          console.log('Using Practice Index parser');
          // Extract employee hours data from the parsed file
          const employeeDetails = extractEmployeeData(jsonData);
          
          // Extract date range from data
          const { earliestDate, latestDate } = extractDateRange(jsonData);
          
          // Calculate totals and format the summary
          const summary = formatSummary(employeeDetails, earliestDate, latestDate);
          resolve(summary);
        }
        
      } catch (error) {
        console.error('Error parsing file:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

