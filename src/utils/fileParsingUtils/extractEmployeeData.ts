
import { EmployeeHoursData } from '@/components/payroll/types';
import { findRateColumns, findPayRateDescriptionColumns, findHoursColumns } from './rateColumnFinder';
import { findStandardHoursColumns } from './findStandardHoursColumns';
import { parseRateDescription, extractRateValue } from './rateTextParser';
import { roundToTwoDecimals } from '@/lib/formatters';

/**
 * Helper function to check if a value is numeric
 */
function isNumericValue(value: any): boolean {
  if (value === undefined || value === null || value === '') return false;
  const parsed = parseFloat(value);
  return !isNaN(parsed) && isFinite(parsed);
}

/**
 * Extract employee hours data from parsed rows
 */
export function extractEmployeeData(jsonData: any[]): EmployeeHoursData[] {
  const employeeDetails: EmployeeHoursData[] = [];
  
  // Process each row of data
  jsonData.forEach((row: any, rowIndex: number) => {
    console.log(`Processing row ${rowIndex}:`, row);
    
    // Extract employee identification info
    const payrollId = row['payroll ID'] || row.EmployeeID || row.ID || '';
    const firstName = row['employee name'] || row.FirstName || row['First Name'] || '';
    const lastName = row.surname || row.LastName || row['Last Name'] || '';
    const employeeName = firstName + (lastName ? ' ' + lastName : '');
    
    console.log(`Employee: ${employeeName}, Payroll ID: ${payrollId}`);
    
    // Method 1: Check for traditional rate columns using multiple naming patterns
    const rateColumns = findRateColumns(row);
    console.log("Found traditional rate columns:", rateColumns);
    
    // Extract rates (regardless of whether they have hours)
    const rate1Value = parseFloat(row['Rate 1'] || row['Rate1'] || '0');
    const rate2Value = parseFloat(row['Rate 2'] || row['Rate2'] || '0');
    const rate3Value = parseFloat(row['Rate 3'] || row['Rate3'] || '0');
    const rate4Value = parseFloat(row['Rate 4'] || row['Rate4'] || '0');
    
    // Process each traditional rate type that has hours
    for (const rateCol of rateColumns) {
      const hours = parseFloat(row[rateCol.columnName]);
      let rateValue = 0;
      
      // Only process if hours value is greater than 0
      if (hours > 0) {
        // Determine which rate to use based on the column name
        if (rateCol.rateNumber === 1) {
          rateValue = rate1Value;
        } else if (rateCol.rateNumber === 2) {
          rateValue = rate2Value;
        } else if (rateCol.rateNumber === 3) {
          rateValue = rate3Value;
        } else if (rateCol.rateNumber === 4) {
          rateValue = rate4Value;
        }
        
        // Add entry for this employee and rate combination
        employeeDetails.push({
          employeeId: '',  // Will be enriched later with DB lookup
          payrollId: payrollId,
          employeeName: employeeName || 'Unknown Employee',
          extraHours: roundToTwoDecimals(hours) || 0,
          entries: 1,
          rateType: `Rate ${rateCol.rateNumber}`,
          rateValue: roundToTwoDecimals(rateValue) || 0
        });
      }
    }
    
    // Method 2: Check for pay rate description columns (new flexible approach)
    const payRateDescColumns = findPayRateDescriptionColumns(row);
    const hoursColumns = findHoursColumns(row);
    
    console.log("Found pay rate description columns:", payRateDescColumns);
    console.log("Found hours columns:", hoursColumns);
    
    // Process pay rate descriptions with associated hours
    for (const payRateColumn of payRateDescColumns) {
      const rateDescription = row[payRateColumn];
      const rateMapping = parseRateDescription(rateDescription);
      
      console.log(`Processing rate description: "${rateDescription}" from column "${payRateColumn}"`);
      
      if (rateMapping) {
        console.log(`Parsed rate description "${rateDescription}" -> Rate ${rateMapping.rateNumber}`);
        
        // Look for hours in adjacent columns or dedicated hours columns
        let hoursValue = 0;
        let usedHoursColumn = '';
        
        // Try each hours column and use the first one with a valid numeric value
        for (const hoursColumn of hoursColumns) {
          const rawValue = row[hoursColumn];
          console.log(`Checking hours column "${hoursColumn}" with value: "${rawValue}"`);
          
          if (isNumericValue(rawValue)) {
            const potentialHours = parseFloat(rawValue);
            console.log(`Parsed hours value: ${potentialHours}`);
            
            if (potentialHours > 0) {
              hoursValue = potentialHours;
              usedHoursColumn = hoursColumn;
              console.log(`✅ Using hours value ${hoursValue} from column "${hoursColumn}"`);
              break; // Use the first valid hours value found
            }
          } else {
            console.log(`❌ Column "${hoursColumn}" contains non-numeric value: "${rawValue}"`);
          }
        }
        
        // If no dedicated hours column found, look for common adjacent column patterns
        if (hoursValue === 0) {
          const fallbackColumns = ['Hours', 'Hrs', 'Time', 'Duration', 'Sessions', 'Unpaid', 'Amount', 'Value'];
          for (const col of fallbackColumns) {
            if (row[col] !== undefined && isNumericValue(row[col])) {
              const potentialHours = parseFloat(row[col]);
              if (potentialHours > 0) {
                hoursValue = potentialHours;
                usedHoursColumn = col;
                console.log(`✅ Using hours value ${hoursValue} from fallback column "${col}"`);
                break;
              }
            }
          }
        }
        
        // Extract rate value from description if present, otherwise use default rates
        let rateValue = extractRateValue(rateDescription) || 0;
        
        // If no rate value in description, use the predefined rates
        if (rateValue === 0) {
          if (rateMapping.rateNumber === 1) {
            rateValue = rate1Value;
          } else if (rateMapping.rateNumber === 2) {
            rateValue = rate2Value;
          } else if (rateMapping.rateNumber === 3) {
            rateValue = rate3Value;
          } else if (rateMapping.rateNumber === 4) {
            rateValue = rate4Value;
          }
        }
        
        // Only add entry if we found valid hours
        if (hoursValue > 0) {
          employeeDetails.push({
            employeeId: '',  // Will be enriched later with DB lookup
            payrollId: payrollId,
            employeeName: employeeName || 'Unknown Employee',
            extraHours: roundToTwoDecimals(hoursValue) || 0,
            entries: 1,
            rateType: rateMapping.rateType,
            rateValue: roundToTwoDecimals(rateValue) || 0
          });
          
          console.log(`✅ Added entry: ${employeeName}, ${hoursValue} hours at ${rateMapping.rateType} from column "${usedHoursColumn}"`);
        } else {
          console.log(`❌ No valid numeric hours found for ${employeeName} with rate type ${rateMapping.rateType}`);
        }
      }
    }
    
    // Method 3: Check for standard hours columns as a fallback (existing logic)
    const { standardHours, standardHoursFound } = findStandardHoursColumns(row);
    
    // Add standard hours entry if found and greater than 0, and no other entries were added for this employee
    if (standardHoursFound && standardHours > 0) {
      // Check if we already have entries for this employee
      const existingEntries = employeeDetails.filter(detail => 
        detail.payrollId === payrollId || detail.employeeName === employeeName
      );
      
      // Only add standard hours if no other rate-specific entries were found
      if (existingEntries.length === 0) {
        employeeDetails.push({
          employeeId: '',  // Will be enriched later with DB lookup
          payrollId: payrollId,
          employeeName: employeeName || 'Unknown Employee',
          extraHours: roundToTwoDecimals(standardHours) || 0,
          entries: 1,
          rateType: 'Standard',
          rateValue: roundToTwoDecimals(rate1Value) || 0
        });
        
        console.log(`✅ Added standard hours entry: ${employeeName}, ${standardHours} hours`);
      }
    }
  });
  
  console.log(`Extracted ${employeeDetails.length} employee hour entries`);
  return employeeDetails;
}
