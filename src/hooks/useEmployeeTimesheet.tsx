
import { useState, useEffect } from 'react';
import { Employee } from '@/hooks/useEmployees';
import { WorkDay } from '@/components/employees/details/work-pattern/types';
import { fetchWorkPatterns } from '@/components/employees/details/work-pattern/utils';
import { supabase } from '@/integrations/supabase/client';
import { addDays, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
  const [workPattern, setWorkPattern] = useState<WorkDay[]>([]);
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
        
        setEmployee(data as Employee);
        
        // Fetch adjacent employee IDs for navigation
        await fetchAdjacentEmployees(data.last_name, data.first_name, data.id);
        
        // Get work pattern
        const patterns = await fetchWorkPatterns(employeeId);
        setWorkPattern(patterns);
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
  }, [employeeId]);
  
  // Generate weekly timesheet based on work pattern and week start date
  useEffect(() => {
    if (!workPattern.length || !weekStartDate) return;
    
    const days: WeeklyTimesheetDay[] = [];
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    // Map day index to work pattern
    const dayToPattern = workPattern.reduce((acc, pattern) => {
      acc[pattern.day] = pattern;
      return acc;
    }, {} as Record<string, WorkDay>);
    
    // Generate timesheet for each day of the selected week
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStartDate, i);
      const dayString = dayNames[i];
      const pattern = dayToPattern[dayString] || { 
        isWorking: false, 
        startTime: null, 
        endTime: null,
        payrollId: null
      };
      
      days.push({
        date,
        dayName: format(date, 'EEE'), // Short day name (Mon, Tue, etc.)
        dayString,
        isWorking: pattern.isWorking || false,
        scheduledStart: pattern.startTime,
        scheduledEnd: pattern.endTime,
        actualStart: null,
        actualEnd: null,
        payrollId: pattern.payrollId || null
      });
    }
    
    setWeeklyTimesheet(days);
  }, [workPattern, weekStartDate]);
  
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
