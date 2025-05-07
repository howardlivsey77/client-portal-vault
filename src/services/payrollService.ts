
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
    console.log('Looking up employees by names:', namesList);
    
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
    
    console.log('Found employees in database:', employees?.length);
    
    // Create lookup by full name and by individual names
    if (employees) {
      employees.forEach(emp => {
        const fullName = `${emp.first_name} ${emp.last_name}`;
        employeeLookup.set(fullName.toLowerCase(), emp);
        
        // Also try just the first name
        employeeLookup.set(emp.first_name.toLowerCase(), emp);
        
        // Also try just the last name
        employeeLookup.set(emp.last_name.toLowerCase(), emp);
      });
    }
    
    // Try to match employees from the file to the database
    data.employeeDetails.forEach(empHours => {
      if (!empHours.employeeName) return;
      
      const lookupName = empHours.employeeName.toLowerCase();
      const dbEmployee = employeeLookup.get(lookupName);
      
      if (dbEmployee) {
        console.log(`Found match for ${empHours.employeeName}: ${dbEmployee.first_name} ${dbEmployee.last_name}`);
        // If found, update the employee ID
        empHours.employeeId = dbEmployee.id;
        
        // Get the appropriate rate based on the rate type
        if (empHours.rateType) {
          // Extract rate number if present (e.g. "Rate 1" -> 1)
          const rateNumber = empHours.rateType.match(/\d+/)?.[0];
          
          if (rateNumber) {
            // Convert to number and get appropriate rate
            const rateNum = parseInt(rateNumber, 10);
            
            switch (rateNum) {
              case 1:
                empHours.rateValue = roundToTwoDecimals(dbEmployee.hourly_rate) || 0;
                console.log(`Applied Rate 1 for ${empHours.employeeName}: ${empHours.rateValue}`);
                break;
              case 2:
                empHours.rateValue = roundToTwoDecimals(dbEmployee.rate_2) || 0;
                console.log(`Applied Rate 2 for ${empHours.employeeName}: ${empHours.rateValue}`);
                break;
              case 3:
                empHours.rateValue = roundToTwoDecimals(dbEmployee.rate_3) || 0;
                console.log(`Applied Rate 3 for ${empHours.employeeName}: ${empHours.rateValue}`);
                break;
              case 4:
                empHours.rateValue = roundToTwoDecimals(dbEmployee.rate_4) || 0;
                console.log(`Applied Rate 4 for ${empHours.employeeName}: ${empHours.rateValue}`);
                break;
              default:
                empHours.rateValue = roundToTwoDecimals(dbEmployee.hourly_rate) || 0;
            }
          } else if (empHours.rateType.toLowerCase() === 'standard') {
            empHours.rateValue = roundToTwoDecimals(dbEmployee.hourly_rate) || 0;
          }
        } else {
          // Use standard hourly rate if no rate type specified
          empHours.rateValue = roundToTwoDecimals(dbEmployee.hourly_rate) || 0;
        }
      } else {
        console.log(`No employee match found for: ${empHours.employeeName}`);
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
