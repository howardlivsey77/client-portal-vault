
import { useEffect } from 'react';
import { useEmployeeTimesheet } from '@/hooks';
import { TimesheetHeader } from './TimesheetHeader';
import { WeeklyTimesheetGrid } from './WeeklyTimesheetGrid';
import { Card, CardContent } from '@/components/ui/card';
import { useTimesheetContext } from './TimesheetContext';
import { EmployeeSelector } from './EmployeeSelector';

interface EmployeeTimesheetProps {
  autoLoad?: boolean;
}

export const EmployeeTimesheet = ({ autoLoad = false }: EmployeeTimesheetProps) => {
  const { 
    currentEmployeeId, 
    setCurrentEmployeeId, 
    currentWeekStartDate,
    actualTimes,
    setActualTime
  } = useTimesheetContext();
  
  const { 
    employee,
    loading,
    weeklyTimesheet,
    prevEmployeeId,
    nextEmployeeId
  } = useEmployeeTimesheet(currentEmployeeId, currentWeekStartDate);

  // Initialize actual times from the fetched timesheet
  useEffect(() => {
    if (weeklyTimesheet.length > 0) {
      const initialTimes: Record<string, { startTime: string | null; endTime: string | null }> = {};
      
      weeklyTimesheet.forEach(day => {
        initialTimes[day.dayString] = {
          startTime: day.actualStart,
          endTime: day.actualEnd
        };
      });
      
      // Update with any existing values from context
      Object.keys(initialTimes).forEach(day => {
        if (actualTimes[day]) {
          initialTimes[day] = {
            ...initialTimes[day],
            ...actualTimes[day]
          };
        }
      });

      // Only update if there are different values to avoid infinite loops
      const hasChanges = Object.keys(initialTimes).some(day => {
        const existing = actualTimes[day] || { startTime: null, endTime: null };
        const updated = initialTimes[day];
        return existing.startTime !== updated.startTime || existing.endTime !== updated.endTime;
      });

      if (hasChanges) {
        Object.keys(initialTimes).forEach(day => {
          setActualTime(day, 'startTime', initialTimes[day].startTime);
          setActualTime(day, 'endTime', initialTimes[day].endTime);
        });
      }
    }
  }, [weeklyTimesheet]);

  const navigateToEmployeeTimesheet = (id: string | null) => {
    if (id) {
      setCurrentEmployeeId(id);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="h-8 w-64 bg-gray-200 animate-pulse rounded-md"></div>
        <div className="h-[400px] w-full bg-gray-200 animate-pulse rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <EmployeeSelector />
      
      {currentEmployeeId || loading ? (
        <>
          <TimesheetHeader
            employee={employee}
            prevEmployeeId={prevEmployeeId}
            nextEmployeeId={nextEmployeeId}
            navigateToEmployeeTimesheet={navigateToEmployeeTimesheet}
          />
          
          <Card className="border-[1.5px] border-black">
            <CardContent className="p-4 overflow-x-auto">
              <WeeklyTimesheetGrid timesheet={weeklyTimesheet} />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-[1.5px] border-black">
          <CardContent className="p-6 text-center">
            <p className="text-lg text-gray-500">Loading employee timesheet...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
