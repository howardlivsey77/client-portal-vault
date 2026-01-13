
import { supabase } from "@/integrations/supabase/client";
import { ExtraHoursSummary } from '@/components/payroll/types';
import { roundToTwoDecimals } from '@/lib/formatters';

/**
 * Enrich the parsed data with employee information from the database
 * This is now mainly used as a fallback when the new matching system isn't used
 */
export const enrichEmployeeData = async (data: ExtraHoursSummary): Promise<void> => {
  try {
    // Check if employees already have IDs (from new matching system)
    const alreadyEnriched = data.employeeDetails.every(emp => emp.employeeId);
    if (alreadyEnriched) {
      console.log('Employee data already enriched by matching system');
      await applyEmployeeRates(data);
      return;
    }
    
    // Fallback to original enrichment logic for backward compatibility
    console.log('Using fallback employee enrichment');
    
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
 * Apply employee rates to already-matched employee data
 */
async function applyEmployeeRates(data: ExtraHoursSummary): Promise<void> {
  try {
    // Get all unique employee IDs
    const employeeIds = [...new Set(data.employeeDetails.map(emp => emp.employeeId).filter(Boolean))];
    
    if (employeeIds.length === 0) return;
    
    // Fetch employee rate data
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, hourly_rate, rate_2, rate_3, rate_4')
      .in('id', employeeIds);
      
    if (error) {
      console.error('Error fetching employee rates:', error);
      return;
    }
    
    const employeeRatesMap = new Map();
    employees?.forEach(emp => {
      employeeRatesMap.set(emp.id, emp);
    });
    
    // Apply rates to employee details
    data.employeeDetails.forEach(empHours => {
      if (empHours.employeeId) {
        const dbEmployee = employeeRatesMap.get(empHours.employeeId);
        if (dbEmployee) {
          applyRateToEmployee(empHours, dbEmployee);
        }
      }
    });
    
  } catch (error) {
    console.error('Error applying employee rates:', error);
  }
}

/**
 * Apply appropriate rate to an employee based on rate type
 */
function applyRateToEmployee(empHours: any, dbEmployee: any): void {
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
          empHours.rateValue = roundToTwoDecimals(dbEmployee.rate_2) || roundToTwoDecimals(dbEmployee.hourly_rate) || 0;
          console.log(`Applied Rate 2 for ${empHours.employeeName}: ${empHours.rateValue} (fallback to hourly_rate: ${!dbEmployee.rate_2})`);
          break;
        case 3:
          // Fall back to rate_2 if rate_3 is not set
          empHours.rateValue = roundToTwoDecimals(dbEmployee.rate_3) || roundToTwoDecimals(dbEmployee.rate_2) || 0;
          console.log(`Applied Rate 3 for ${empHours.employeeName}: ${empHours.rateValue} (fallback to rate_2: ${!dbEmployee.rate_3})`);
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
}

/**
 * Match employees from parsed data with database records and apply appropriate rates (legacy function)
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
      
      applyRateToEmployee(empHours, dbEmployee);
    } else {
      console.log(`No employee match found for: ${empHours.employeeName}`);
    }
  });
};
