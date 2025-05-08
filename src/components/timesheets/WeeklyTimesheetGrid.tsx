
import { format } from 'date-fns';
import { WeeklyTimesheetDay } from '@/hooks/useEmployeeTimesheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTimesheetContext } from './TimesheetContext';
import { SaveIcon } from 'lucide-react';

interface WeeklyTimesheetGridProps {
  timesheet: WeeklyTimesheetDay[];
}

export const WeeklyTimesheetGrid = ({ timesheet }: WeeklyTimesheetGridProps) => {
  const { setActualTime, saveTimesheet, saving, actualTimes } = useTimesheetContext();

  const handleActualTimeChange = (
    dayString: string,
    type: 'actualStart' | 'actualEnd',
    value: string
  ) => {
    const mappedType = type === 'actualStart' ? 'startTime' : 'endTime';
    setActualTime(dayString, mappedType, value || null);
  };

  const handleSaveTimesheet = async () => {
    await saveTimesheet(timesheet);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Weekly Schedule</h3>
        <Button 
          onClick={handleSaveTimesheet} 
          disabled={saving}
          className="bg-green-600 hover:bg-green-700"
        >
          <SaveIcon className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Timesheet'}
        </Button>
      </div>
      
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Day</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled Start</TableHead>
              <TableHead>Scheduled End</TableHead>
              <TableHead>Actual Start</TableHead>
              <TableHead>Actual End</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timesheet.map((day) => {
              const actualStart = actualTimes[day.dayString]?.startTime || day.actualStart;
              const actualEnd = actualTimes[day.dayString]?.endTime || day.actualEnd;
              
              return (
                <TableRow key={day.dayString}>
                  <TableCell className="font-medium">{day.dayName}</TableCell>
                  <TableCell>{format(day.date, 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={day.isWorking ? "default" : "outline"}
                      className={day.isWorking ? "bg-green-500 hover:bg-green-600" : "text-gray-500"}
                    >
                      {day.isWorking ? 'Working' : 'Off'}
                    </Badge>
                  </TableCell>
                  <TableCell>{day.isWorking ? (day.scheduledStart || 'N/A') : '-'}</TableCell>
                  <TableCell>{day.isWorking ? (day.scheduledEnd || 'N/A') : '-'}</TableCell>
                  <TableCell>
                    {day.isWorking ? (
                      <Input
                        type="time"
                        value={actualStart || ''}
                        onChange={(e) => handleActualTimeChange(day.dayString, 'actualStart', e.target.value)}
                        className="w-32"
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {day.isWorking ? (
                      <Input
                        type="time"
                        value={actualEnd || ''}
                        onChange={(e) => handleActualTimeChange(day.dayString, 'actualEnd', e.target.value)}
                        className="w-32"
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
