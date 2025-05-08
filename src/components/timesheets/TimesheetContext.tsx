
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Employee } from '@/hooks/useEmployees';
import { WorkDay } from '@/components/employees/details/work-pattern/types';

interface TimesheetContextType {
  currentEmployeeId: string | null;
  setCurrentEmployeeId: (id: string | null) => void;
  currentWeekStartDate: Date;
  setCurrentWeekStartDate: (date: Date) => void;
  actualTimes: Record<string, { startTime: string | null; endTime: string | null }>;
  setActualTime: (day: string, type: 'startTime' | 'endTime', value: string | null) => void;
}

const TimesheetContext = createContext<TimesheetContextType>({
  currentEmployeeId: null,
  setCurrentEmployeeId: () => {},
  currentWeekStartDate: new Date(),
  setCurrentWeekStartDate: () => {},
  actualTimes: {},
  setActualTime: () => {},
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

  const setActualTime = (day: string, type: 'startTime' | 'endTime', value: string | null) => {
    setActualTimes(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [type]: value
      }
    }));
  };

  return (
    <TimesheetContext.Provider value={{
      currentEmployeeId,
      setCurrentEmployeeId,
      currentWeekStartDate,
      setCurrentWeekStartDate,
      actualTimes,
      setActualTime
    }}>
      {children}
    </TimesheetContext.Provider>
  );
};
