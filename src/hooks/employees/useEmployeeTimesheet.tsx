import { useState, useEffect } from 'react';
import { Employee } from '@/types/employee-types';
import { supabase } from '@/integrations/supabase/client';
import { addDays, format } from 'date-fns';
import { useToast } from '@/hooks/common/use-toast';
import { fetchTimesheetEntries } from '@/services';

export interface WeeklyTimesheetDay {
  date: Date;
  dayName: string;
  dayString: string; // e.g., "Monday"
  isWorking: boolean;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  payrollId: string | null;
}

export const useEmployeeTimesheet = (employeeId: string | null, weekStartDate: Date) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyTimesheet, setWeeklyTimesheet] = useState<WeeklyTimesheetDay[]>([]);
  const [prevEmployeeId, setPrevEmployeeId] = useState<string | null>(null);
  const [nextEmployeeId, setNextEmployeeId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch employee details
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      if (!employeeId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        // Get employee details
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('id', employeeId)
          .single();
          
        if (error) throw error;
        
        setEmployee(data as unknown as Employee);
        
        // Fetch adjacent employee IDs for navigation
        await fetchAdjacentEmployees(data.last_name, data.first_name, data.id);
        
        // Get timesheet entries
        const timesheetData = await fetchTimesheetEntries(employeeId, weekStartDate);
        setWeeklyTimesheet(timesheetData);
      } catch (error: any) {
        toast({
          title: "Error loading employee timesheet",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployeeDetails();
  }, [employeeId, weekStartDate]);
  
  const fetchAdjacentEmployees = async (lastName: string, firstName: string, currentId: string) => {
    try {
      // Fetch next employee (alphabetically by last name, then first name)
      const { data: nextData, error: nextError } = await supabase
        .from("employees")
        .select("id")
        .or(`last_name.gt.${lastName},and(last_name.eq.${lastName},first_name.gt.${firstName})`)
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true })
        .limit(1);
      
      if (!nextError && nextData && nextData.length > 0) {
        setNextEmployeeId(nextData[0].id);
      } else {
        setNextEmployeeId(null);
      }
      
      // Fetch previous employee
      const { data: prevData, error: prevError } = await supabase
        .from("employees")
        .select("id")
        .or(`last_name.lt.${lastName},and(last_name.eq.${lastName},first_name.lt.${firstName})`)
        .order('last_name', { ascending: false })
        .order('first_name', { ascending: false })
        .limit(1);
      
      if (!prevError && prevData && prevData.length > 0) {
        setPrevEmployeeId(prevData[0].id);
      } else {
        setPrevEmployeeId(null);
      }
    } catch (error) {
      console.error("Error fetching adjacent employees:", error);
    }
  };
  
  return {
    employee,
    loading,
    weeklyTimesheet,
    prevEmployeeId,
    nextEmployeeId
  };
};
