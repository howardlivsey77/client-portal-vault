
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { WeeklyTimesheetDay } from '@/hooks/useEmployeeTimesheet';
import { saveTimesheetEntries } from '@/services';
import { useToast } from '@/hooks';
import { supabase } from '@/integrations/supabase/client';

interface TimesheetSettings {
  earlyClockInTolerance: number;
  lateClockInTolerance: number;
  earlyClockOutTolerance: number;
  lateClockOutTolerance: number;
  roundClockTimes: boolean;
  roundingIntervalMinutes: number;
  requireManagerApproval: boolean;
  allowEmployeeNotes: boolean;
}

interface TimesheetContextType {
  currentEmployeeId: string | null;
  setCurrentEmployeeId: (id: string | null) => void;
  currentWeekStartDate: Date;
  setCurrentWeekStartDate: (date: Date) => void;
  actualTimes: Record<string, { startTime: string | null; endTime: string | null }>;
  setActualTime: (day: string, type: 'startTime' | 'endTime', value: string | null) => void;
  saveTimesheet: (timesheet: WeeklyTimesheetDay[]) => Promise<boolean>;
  saving: boolean;
  settings: TimesheetSettings;
  setSettings: (settings: TimesheetSettings) => void;
  loadFirstEmployee: () => Promise<void>;
}

const defaultSettings: TimesheetSettings = {
  earlyClockInTolerance: 15,
  lateClockInTolerance: 5,
  earlyClockOutTolerance: 5,
  lateClockOutTolerance: 15,
  roundClockTimes: false,
  roundingIntervalMinutes: 15,
  requireManagerApproval: true,
  allowEmployeeNotes: true
};

const TimesheetContext = createContext<TimesheetContextType>({
  currentEmployeeId: null,
  setCurrentEmployeeId: () => {},
  currentWeekStartDate: new Date(),
  setCurrentWeekStartDate: () => {},
  actualTimes: {},
  setActualTime: () => {},
  saveTimesheet: async () => false,
  saving: false,
  settings: defaultSettings,
  setSettings: () => {},
  loadFirstEmployee: async () => {}
});

export const useTimesheetContext = () => useContext(TimesheetContext);

interface TimesheetProviderProps {
  children: ReactNode;
}

export const TimesheetProvider = ({ children }: TimesheetProviderProps) => {
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState<Date>(() => {
    // Default to current week's Monday
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(today.setDate(diff));
  });
  const [actualTimes, setActualTimes] = useState<Record<string, { startTime: string | null; endTime: string | null }>>({});
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<TimesheetSettings>(defaultSettings);
  const { toast } = useToast();

  const setActualTime = (day: string, type: 'startTime' | 'endTime', value: string | null) => {
    setActualTimes(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [type]: value
      }
    }));
  };

  const loadFirstEmployee = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id')
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true })
        .limit(1);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setCurrentEmployeeId(data[0].id);
      }
    } catch (error) {
      console.error("Error loading first employee:", error);
    }
  };

  const saveTimesheet = async (timesheet: WeeklyTimesheetDay[]): Promise<boolean> => {
    if (!currentEmployeeId) {
      toast({
        title: "Cannot save timesheet",
        description: "No employee selected",
        variant: "destructive"
      });
      return false;
    }

    setSaving(true);

    // Prepare the entries to save
    const entries = timesheet.map(day => ({
      date: day.date,
      scheduledStart: day.scheduledStart,
      scheduledEnd: day.scheduledEnd,
      actualStart: actualTimes[day.dayString]?.startTime || null,
      actualEnd: actualTimes[day.dayString]?.endTime || null,
      payrollId: day.payrollId
    }));

    try {
      const result = await saveTimesheetEntries(currentEmployeeId, entries);
      setSaving(false);
      return result;
    } catch (error) {
      console.error("Error saving timesheet:", error);
      setSaving(false);
      return false;
    }
  };

  return (
    <TimesheetContext.Provider value={{
      currentEmployeeId,
      setCurrentEmployeeId,
      currentWeekStartDate,
      setCurrentWeekStartDate,
      actualTimes,
      setActualTime,
      saveTimesheet,
      saving,
      settings,
      setSettings,
      loadFirstEmployee
    }}>
      {children}
    </TimesheetContext.Provider>
  );
};
