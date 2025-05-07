
import { parseExtraHoursFile } from '@/utils/fileParsingUtils';
import { ExtraHoursSummary } from '@/components/payroll/types';
import { supabase } from "@/integrations/supabase/client";
import { roundToTwoDecimals } from '@/lib/formatters';

/**
 * Process an extra hours file and return summary data
 */
export const processExtraHoursFile = async (file: File): Promise<ExtraHoursSummary> => {
  try {
    console.log('Processing extra hours file:', file.name);
    
    // Parse the file
    const parsedData = await parseExtraHoursFile(file);
    
    // If available, enrich with employee data from the database
    await enrichWithEmployeeData(parsedData);
    
    return parsedData;
  } catch (error) {
    console.error('Error processing extra hours file:', error);
    throw error;
  }
};

/**
 * Enrich the parsed data with employee information from the database
 */
const enrichWithEmployeeData = async (data: ExtraHoursSummary): Promise<void> => {
  try {
    // Extract unique employee names to look up
    const employeeNames = new Set<string>();
    data.employeeDetails.forEach(emp => {
      if (emp.employeeName) {
        employeeNames.add(emp.employeeName);
      }
    });
    
    if (employeeNames.size === 0) return;
    
    // Create an array from the Set
    const namesList = Array.from(employeeNames);
    
    // Create a lookup object for first name + last name
    const employeeLookup = new Map<string, any>();
    
    // Get employee data from database
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*');
      
    if (error) {
      console.error('Error fetching employees:', error);
      return;
    }
    
    // Create lookup by full name and by individual names
    if (employees) {
      employees.forEach(emp => {
        const fullName = `${emp.first_name} ${emp.last_name}`;
        employeeLookup.set(fullName.toLowerCase(), emp);
        
        // Also try just the first name
        employeeLookup.set(emp.first_name.toLowerCase(), emp);
      });
    }
    
    // Try to match employees from the file to the database
    data.employeeDetails.forEach(empHours => {
      const lookupName = empHours.employeeName.toLowerCase();
      const dbEmployee = employeeLookup.get(lookupName);
      
      if (dbEmployee) {
        // If found, update the employee ID
        empHours.employeeId = dbEmployee.id;
        
        // If we don't have rate information yet, try to get it from the DB
        if (!empHours.rateValue || empHours.rateValue === 0) {
          // Based on the rate type, get the appropriate rate
          if (empHours.rateType === 'Standard') {
            empHours.rateValue = roundToTwoDecimals(dbEmployee.hourly_rate) || 0;
          } else if (empHours.rateType === 'Rate 2') {
            empHours.rateValue = roundToTwoDecimals(dbEmployee.rate_2) || 0;
          } else if (empHours.rateType === 'Rate 3') {
            empHours.rateValue = roundToTwoDecimals(dbEmployee.rate_3) || 0;
          } else if (empHours.rateType === 'Rate 4') {
            empHours.rateValue = roundToTwoDecimals(dbEmployee.rate_4) || 0;
          }
        } else if (empHours.rateValue) {
          empHours.rateValue = roundToTwoDecimals(empHours.rateValue);
        }
      }
    });
    
  } catch (error) {
    console.error('Error enriching employee data:', error);
  }
};

/**
 * Save processed payroll data to the database
 * This is a placeholder function for future implementation
 */
export const savePayrollData = async (data: ExtraHoursSummary) => {
  // This would be implemented based on your specific database structure
  console.log('Saving payroll data:', data);
  
  // Example implementation:
  // 1. Create a payroll period record
  // 2. Save each employee's hours as payroll entries
  // 3. Return success/failure
  
  return { success: true, message: "Payroll data saved successfully" };
};
