
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
 * Helper function to parse time strings in HH:MM format
 * Examples: "04:30" -> 4.5, "00:30" -> 0.5, "10:15" -> 10.25
 */
function parseTimeString(value: any): number | null {
  if (typeof value !== 'string') return null;
  
  // Match HH:MM or H:MM format (with optional leading zeros)
  const timeRegex = /^(\d{1,2}):(\d{2})$/;
  const match = value.trim().match(timeRegex);
  
  if (!match) return null;
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  
  // Validate ranges
  if (minutes < 0 || minutes >= 60) {
    console.warn(`Invalid minutes in time string: ${value}`);
    return null;
  }
  
  // Convert to decimal hours
  const decimalHours = hours + (minutes / 60);
  console.log(`Parsed time string "${value}" -> ${decimalHours} hours (${hours}h ${minutes}m)`);
  
  return decimalHours;
}

/**
 * Helper function to detect and convert Excel time decimal values to hours
 * Excel stores time as decimal fractions of a day (e.g., 0.125 = 3 hours)
 */
function convertTimeDecimalToHours(value: any): number {
  // NEW: Try to parse as HH:MM format first
  const timeStringHours = parseTimeString(value);
  if (timeStringHours !== null) {
    return timeStringHours;
  }
  
  if (!isNumericValue(value)) return 0;
  
  const numericValue = parseFloat(value);
  
  // Check if this looks like an Excel time decimal (between 0 and 1)
  // and when multiplied by 24 gives a reasonable hour value (0-24)
  if (numericValue > 0 && numericValue < 1) {
    const potentialHours = numericValue * 24;
    // Only convert if it results in a reasonable hour value
    if (potentialHours <= 24) {
      console.log(`Converting Excel time decimal: ${numericValue} -> ${potentialHours} hours`);
      return potentialHours;
    }
  }
  
  // If it's already a normal hour value (> 1), return as-is
  if (numericValue >= 1) {
    return numericValue;
  }
  
  // For values between 0 and 1 that don't convert to reasonable hours,
  // treat as decimal hours (e.g., 0.5 hours)
  return numericValue;
}

/**
 * Extract employee name from various column patterns
 */
function extractEmployeeName(row: any): { employeeName: string, payrollId: string, email: string } {
  console.log('Extracting employee name from row:', Object.keys(row));
  
  // Try different patterns for employee identification
  let firstName = '';
  let lastName = '';
  let payrollId = '';
  
  // Pattern 1: Staff First Name / Staff Last Name
  if (row['Staff First Name'] || row['Staff Last Name']) {
    firstName = row['Staff First Name'] || '';
    lastName = row['Staff Last Name'] || '';
    console.log('Found Staff Name columns:', { firstName, lastName });
  }
  
  // Pattern 2: employee name / surname
  else if (row['employee name'] || row.surname) {
    firstName = row['employee name'] || '';
    lastName = row.surname || '';
    console.log('Found employee name/surname columns:', { firstName, lastName });
  }
  
  // Pattern 3: FirstName / LastName
  else if (row.FirstName || row.LastName || row['First Name'] || row['Last Name']) {
    firstName = row.FirstName || row['First Name'] || '';
    lastName = row.LastName || row['Last Name'] || '';
    console.log('Found FirstName/LastName columns:', { firstName, lastName });
  }
  
  // Pattern 4: Try case-insensitive search for common patterns
  else {
    const keys = Object.keys(row);
    
    // Look for first name patterns
    const firstNameKey = keys.find(key => 
      key.toLowerCase().includes('first') && key.toLowerCase().includes('name') ||
      key.toLowerCase() === 'firstname' ||
      key.toLowerCase().includes('staff') && key.toLowerCase().includes('first')
    );
    
    // Look for last name patterns
    const lastNameKey = keys.find(key => 
      key.toLowerCase().includes('last') && key.toLowerCase().includes('name') ||
      key.toLowerCase().includes('surname') ||
      key.toLowerCase() === 'lastname' ||
      key.toLowerCase().includes('staff') && key.toLowerCase().includes('last')
    );
    
    if (firstNameKey) {
      firstName = row[firstNameKey] || '';
      console.log(`Found first name in column "${firstNameKey}":`, firstName);
    }
    
    if (lastNameKey) {
      lastName = row[lastNameKey] || '';
      console.log(`Found last name in column "${lastNameKey}":`, lastName);
    }
  }
  
  // Extract payroll ID from various patterns
  payrollId = row['payroll ID'] || row.EmployeeID || row.ID || row['Staff ID'] || row.StaffID || '';
  
  // Extract email from various patterns
  let email = '';
  const emailPatterns = [
    'Email', 'email', 'EMAIL',
    'Email Address', 'email address', 'EMAIL ADDRESS',
    'E-mail', 'e-mail', 'E-MAIL',
    'Staff Email', 'staff email', 'STAFF EMAIL',
    'Work Email', 'work email', 'WORK EMAIL',
    'Contact Email', 'contact email', 'CONTACT EMAIL'
  ];

  for (const pattern of emailPatterns) {
    if (row[pattern]) {
      email = String(row[pattern]).trim().toLowerCase();
      console.log(`Found email in column "${pattern}":`, email);
      break;
    }
  }

  // Validate email format (basic check)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    console.warn(`Invalid email format found: "${email}", ignoring`);
    email = '';
  }
  
  // Create full name
  const employeeName = (firstName + (lastName ? ' ' + lastName : '')).trim();
  
  console.log('Extracted employee info:', { 
    employeeName, 
    payrollId,
    email,
    firstName, 
    lastName 
  });
  
  return { employeeName, payrollId, email };
}

/**
 * Extract employee hours data from parsed rows
 */
export function extractEmployeeData(jsonData: any[]): EmployeeHoursData[] {
  const employeeDetails: EmployeeHoursData[] = [];
  
  console.log('Processing employee data extraction from', jsonData.length, 'rows');
  console.log('Sample row keys:', jsonData.length > 0 ? Object.keys(jsonData[0]) : 'No data');
  
  // Process each row of data
  jsonData.forEach((row: any, rowIndex: number) => {
    console.log(`\n=== Processing row ${rowIndex} ===`);
    
    // Extract employee identification info using enhanced logic
    const { employeeName, payrollId, email } = extractEmployeeName(row);
    
    // Skip if no employee name found
    if (!employeeName) {
      console.log(`❌ Skipping row ${rowIndex}: No employee name found`);
      return;
    }
    
    console.log(`Processing employee: "${employeeName}", Payroll ID: "${payrollId}"`);
    
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
      const rawHours = row[rateCol.columnName];
      const hours = convertTimeDecimalToHours(rawHours);
      let rateValue = 0;
      
      console.log(`Processing rate column "${rateCol.columnName}": raw value "${rawHours}" -> ${hours} hours`);
      
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
          employeeName: employeeName,
          email: email,
          extraHours: roundToTwoDecimals(hours) || 0,
          entries: 1,
          rateType: `Rate ${rateCol.rateNumber}`,
          rateValue: roundToTwoDecimals(rateValue) || 0
        });
        
        console.log(`✅ Added rate entry: ${employeeName}, ${hours} hours at Rate ${rateCol.rateNumber}`);
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
          console.log(`Checking hours column "${hoursColumn}" with raw value: "${rawValue}"`);
          
          if (isNumericValue(rawValue)) {
            const potentialHours = convertTimeDecimalToHours(rawValue);
            console.log(`Converted hours value: ${potentialHours}`);
            
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
              const potentialHours = convertTimeDecimalToHours(row[col]);
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
            employeeName: employeeName,
            email: email,
            extraHours: roundToTwoDecimals(hoursValue) || 0,
            entries: 1,
            rateType: rateMapping.rateType,
            rateValue: roundToTwoDecimals(rateValue) || 0
          });
          
          console.log(`✅ Added pay rate entry: ${employeeName}, ${hoursValue} hours at ${rateMapping.rateType} from column "${usedHoursColumn}"`);
        } else {
          console.log(`❌ No valid numeric hours found for ${employeeName} with rate type ${rateMapping.rateType}`);
        }
      }
    }
    
    // Method 3: Check for standard hours columns as a fallback (existing logic)
    const { standardHours: rawStandardHours, standardHoursFound } = findStandardHoursColumns(row);
    const standardHours = convertTimeDecimalToHours(rawStandardHours);
    
    console.log(`Standard hours: raw value "${rawStandardHours}" -> ${standardHours} hours`);
    
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
          employeeName: employeeName,
          email: email,
          extraHours: roundToTwoDecimals(standardHours) || 0,
          entries: 1,
          rateType: 'Standard',
          rateValue: roundToTwoDecimals(rate1Value) || 0
        });
        
        console.log(`✅ Added standard hours entry: ${employeeName}, ${standardHours} hours`);
      }
    }
  });
  
  console.log(`\n=== Extraction Summary ===`);
  console.log(`Extracted ${employeeDetails.length} employee hour entries`);
  console.log('Employee names found:', employeeDetails.map(e => e.employeeName));
  
  return employeeDetails;
}
