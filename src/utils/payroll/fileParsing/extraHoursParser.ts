
import * as XLSX from 'xlsx';
import { ExtraHoursSummary } from '@/components/payroll/types';
import { extractDateRange } from './dateExtractor';
import { extractEmployeeData } from './extractEmployeeData';
import { formatSummary } from './formatSummary';
import { isTeamnetFormat, parseTeamnetData } from './teamnetParser';
import { ImportFormat } from '@/components/payroll/FormatSelector';

/**
 * Parse an Excel or CSV file containing extra hours data
 * @param file - The file to parse
 * @param format - Optional format override (practice-index or teamnet). If not provided, will auto-detect.
 */
export const parseExtraHoursFile = async (file: File, format?: ImportFormat): Promise<ExtraHoursSummary> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Assume first sheet contains the data
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log('Parsed file data:', jsonData);
        
        // Determine format - use provided format or auto-detect
        const useTeamnet = format === 'teamnet' || (!format && isTeamnetFormat(jsonData));
        
        if (useTeamnet) {
          console.log('Using Teamnet parser with time-based rate calculation');
          const summary = parseTeamnetData(jsonData);
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
