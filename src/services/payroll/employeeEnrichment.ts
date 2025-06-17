
import { supabase } from "@/integrations/supabase/client";
import { ExtraHoursSummary } from '@/components/payroll/types';
import { roundToTwoDecimals } from '@/lib/formatters';

/**
 * Enrich the parsed data with employee information from the database
 */
export const enrichEmployeeData = async (data: ExtraHoursSummary): Promise<void> => {
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
    
    // Update each employee with matching data from the database
    matchEmployeesWithRates(data, employeeLookup);
    
  } catch (error) {
    console.error('Error enriching employee data:', error);
  }
};

/**
 * Match employees from parsed data with database records and apply appropriate rates
 */
const matchEmployeesWithRates = (
  data: ExtraHoursSummary, 
  employeeLookup: Map<string, any>
): void => {
  data.employeeDetails.forEach(empHours => {
    if (!empHours.employeeName) return;
    
    const lookupName = empHours.employeeName.toLowerCase();
    const dbEmployee = employeeLookup.get(lookupName);
    
    if (dbEmployee) {
      console.log(`Found match for ${empHours.employeeName}: ${dbEmployee.first_name} ${dbEmployee.last_name}`);
      // If found, update the employee ID
      empHours.employeeId = dbEmployee.id;
      // Add the payroll ID
      empHours.payrollId = dbEmployee.payroll_id;
      
      // Get the appropriate rate based on the rate type
      if (empHours.rateType) {
        // Handle both traditional rate numbers and new descriptive rate types
        let rateNumber = null;
        
        // Extract rate number if present (e.g. "Rate 1" -> 1)
        const traditionalRateMatch = empHours.rateType.match(/Rate\s*(\d+)/i);
        if (traditionalRateMatch) {
          rateNumber = parseInt(traditionalRateMatch[1], 10);
        }
        
        // Map rate types to appropriate employee rate fields
        if (rateNumber) {
          switch (rateNumber) {
            case 1:
              empHours.rateValue = roundToTwoDecimals(dbEmployee.hourly_rate) || 0;
              console.log(`Applied Rate 1 (hourly_rate) for ${empHours.employeeName}: ${empHours.rateValue}`);
              break;
            case 2:
              empHours.rateValue = roundToTwoDecimals(dbEmployee.rate_2) || 0;
              console.log(`Applied Rate 2 (Standard Overtime) for ${empHours.employeeName}: ${empHours.rateValue}`);
              break;
            case 3:
              empHours.rateValue = roundToTwoDecimals(dbEmployee.rate_3) || 0;
              console.log(`Applied Rate 3 (Extended Access) for ${empHours.employeeName}: ${empHours.rateValue}`);
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
          console.log(`Applied standard rate for ${empHours.employeeName}: ${empHours.rateValue}`);
        } else {
          // For any unrecognized rate type, default to hourly_rate
          empHours.rateValue = roundToTwoDecimals(dbEmployee.hourly_rate) || 0;
          console.log(`Applied default rate for unrecognized type "${empHours.rateType}" for ${empHours.employeeName}: ${empHours.rateValue}`);
        }
      } else {
        // Use standard hourly rate if no rate type specified
        empHours.rateValue = roundToTwoDecimals(dbEmployee.hourly_rate) || 0;
      }
    } else {
      console.log(`No employee match found for: ${empHours.employeeName}`);
    }
  });
};
