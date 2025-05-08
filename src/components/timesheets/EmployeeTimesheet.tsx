
import { useEffect } from 'react';
import { useEmployeeTimesheet } from '@/hooks/useEmployeeTimesheet';
import { TimesheetHeader } from './TimesheetHeader';
import { WeeklyTimesheetGrid } from './WeeklyTimesheetGrid';
import { Card, CardContent } from '@/components/ui/card';
import { useTimesheetContext } from './TimesheetContext';
import { EmployeeSelector } from './EmployeeSelector';

export const EmployeeTimesheet = () => {
  const { currentEmployeeId, setCurrentEmployeeId, currentWeekStartDate } = useTimesheetContext();
  
  const { 
    employee,
    loading,
    weeklyTimesheet,
    prevEmployeeId,
    nextEmployeeId
  } = useEmployeeTimesheet(currentEmployeeId, currentWeekStartDate);

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
      
      {currentEmployeeId ? (
        <>
          <TimesheetHeader
            employee={employee}
            prevEmployeeId={prevEmployeeId}
            nextEmployeeId={nextEmployeeId}
            navigateToEmployeeTimesheet={navigateToEmployeeTimesheet}
          />
          
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <WeeklyTimesheetGrid timesheet={weeklyTimesheet} />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-lg text-gray-500">Please select an employee to view their timesheet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
