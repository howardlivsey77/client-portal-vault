/**
 * Auto-detect file format based on column names
 */

import { ImportFormat } from '@/components/payroll/FormatSelector';

/**
 * Detect the format of a parsed file based on its columns
 */
export function detectFileFormat(jsonData: any[]): ImportFormat | null {
  if (!jsonData || jsonData.length === 0) return null;
  
  const firstRow = jsonData[0];
  const keys = Object.keys(firstRow).map(k => k.toLowerCase());
  
  // Teamnet format has Name, Surname, Time from, Time to columns
  const hasName = keys.some(k => k === 'name');
  const hasSurname = keys.some(k => k === 'surname');
  const hasTimeFrom = keys.some(k => k.includes('time from') || k === 'time_from');
  const hasTimeTo = keys.some(k => k.includes('time to') || k === 'time_to');
  
  if (hasName && hasSurname && hasTimeFrom && hasTimeTo) {
    return 'teamnet';
  }
  
  // Practice Index format has Employee/Staff Name column, or Hours/Extra Hours columns with Rate columns
  const hasEmployee = keys.some(k => k.includes('employee') || k.includes('staff') || k.includes('name'));
  const hasHours = keys.some(k => k.includes('hour') || k.includes('time'));
  
  if (hasEmployee && hasHours) {
    return 'practice-index';
  }
  
  return null;
}
